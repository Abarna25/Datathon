const multer = require('multer');
const os = require('os');
const AttachmentService = require('../services/AttachmentService');

const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 20 * 1024 * 1024 }
});

class AttachmentController {
    static get middleware() {
        return upload.single('file');
    }

    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'file is required' });
            }
            const { caseId } = req.body;
            if (!caseId) {
                return res.status(400).json({ success: false, error: 'caseId is required' });
            }
            const attachment = await AttachmentService.handleUpload(req, req.file, {
                caseId,
                conversationId: req.params.id
            });
            res.status(201).json({ success: true, data: attachment });
        } catch (error) {
            console.error('Error in AttachmentController.upload:', error);
            res.status(500).json({ success: false, error: error.message || 'Attachment upload failed', data: null });
        }
    }
}

module.exports = AttachmentController;
