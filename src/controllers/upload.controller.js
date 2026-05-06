const ApiError = require('../utils/ApiError');

const uploadImage = (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError(400, 'Please upload a file');
        }

        // Construct the full URL
        const protocol = 'https';
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            url: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadImage
};
