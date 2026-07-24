const fs = require('fs');
const path = require('path');
const catalyst = require('zcatalyst-sdk-node');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { parse: parseCsvSync } = require('csv-parse/sync');

const ATTACHMENT_FOLDER_NAME = 'investigation-attachments';
const MAX_STORED_TEXT_CHARS = 50000;
let cachedFolderId = null;

async function getOrCreateFolder(req) {
    if (cachedFolderId) return cachedFolderId;
    try {
        const filestore = catalyst.initialize(req).filestore();
        const folders = await filestore.getAllFolders();
        const existing = folders.find((f) => {
            const details = f._folderDetails || f;
            return details.folder_name === ATTACHMENT_FOLDER_NAME;
        });
        if (existing) {
            cachedFolderId = (existing._folderDetails || existing).id;
            return cachedFolderId;
        }
        const created = await filestore.createFolder(ATTACHMENT_FOLDER_NAME);
        cachedFolderId = (created._folderDetails || created).id;
        return cachedFolderId;
    } catch (error) {
        console.error('[AttachmentService] Folder provisioning failed, raw bytes will not be stored:', error.message);
        return null;
    }
}

async function extractText(file, req) {
    const ext = path.extname(file.originalname).toLowerCase();
    try {
        if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp'].includes(ext)) {
            try {
                if (req) {
                    const zia = catalyst.initialize(req).zia();
                    const stream = fs.createReadStream(file.path);
                    const ziaResult = await zia.extractOpticalCharacters(stream, { language: 'eng' });
                    if (ziaResult && (ziaResult.text || ziaResult.confidence)) {
                        return ziaResult.text || '';
                    }
                }
            } catch (ziaError) {
                console.warn(`[AttachmentService] Catalyst Zia OCR scan warning for ${file.originalname}:`, ziaError.message);
            }
        }

        if (ext === '.pdf') {
            const buffer = fs.readFileSync(file.path);
            const parsed = await pdfParse(buffer);
            if (parsed.text && parsed.text.trim().length > 50) {
                return parsed.text;
            }
            if (req) {
                try {
                    const zia = catalyst.initialize(req).zia();
                    const stream = fs.createReadStream(file.path);
                    const ziaResult = await zia.extractOpticalCharacters(stream, { language: 'eng' });
                    if (ziaResult && ziaResult.text) return ziaResult.text;
                } catch (e) {}
            }
            return parsed.text || '';
        }

        if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: file.path });
            return result.value;
        }

        if (ext === '.txt') {
            return fs.readFileSync(file.path, 'utf-8');
        }

        if (ext === '.csv') {
            const raw = fs.readFileSync(file.path, 'utf-8');
            const records = parseCsvSync(raw, { columns: false, skip_empty_lines: true, relax_column_count: true });
            return records.slice(0, 200).map((row) => row.join(' | ')).join('\n');
        }

        return '';
    } catch (error) {
        console.error(`[AttachmentService] Text extraction failed for ${file.originalname}:`, error.message);
        return '';
    }
}

class AttachmentService {
    static async handleUpload(req, file, { caseId, conversationId }) {
        const extractedText = await extractText(file, req);

        let fileStoreKey = '';
        const folderId = await getOrCreateFolder(req);
        if (folderId) {
            try {
                const uploaded = await catalyst.initialize(req).filestore().folder(folderId).uploadFile({
                    code: fs.createReadStream(file.path),
                    name: file.originalname
                });
                fileStoreKey = String(uploaded.id || '');
            } catch (error) {
                console.error('[AttachmentService] Raw file upload failed:', error.message);
            }
        }

        fs.unlink(file.path, () => {});

        // Return local object properties and skip nonexistent database table writes
        const rowId = `ATT-${Date.now()}`;
        const result = {
            id: rowId,
            filename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            hasExtractedText: !!extractedText,
            extractedText: (extractedText || '').slice(0, MAX_STORED_TEXT_CHARS),
            status: 'ready'
        };

        // Publish Serverless Event Signal
        try {
            const SignalService = require('./SignalService');
            SignalService.publish(req, 'EVIDENCE_UPLOADED', {
                caseId,
                conversationId,
                filename: file.originalname,
                mimeType: file.mimetype,
                hasText: !!extractedText
            }).catch(() => {});
        } catch (e) {}

        return result;
    }
}

module.exports = AttachmentService;
