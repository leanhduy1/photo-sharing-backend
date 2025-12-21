const multer = require("multer");  

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    // Lỗi Multer
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }

    // Lỗi không phải ảnh
    if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({ error: err.message });
    }
    
    // Lỗi validation schema
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    
    // Lỗi ObjectId không hợp lệ
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Lỗi duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0]; 
        const value = err.keyValue[field];           
        return res.status(409).json({
            error: `${field} '${value}' already exists`
        });
    }

    // Default 
    const statusCode = err.statusCode || 500;
    const message = err.statusCode ? err.message : 'Internal Server Error';
    
    res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;