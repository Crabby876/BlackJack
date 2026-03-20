const express = require('express');
const router = express.Router();

// Beispiel-Route
router.get('/', (req, res) => {
    res.send('Game-Route aktiv');
});

// WICHTIG:
module.exports = router;