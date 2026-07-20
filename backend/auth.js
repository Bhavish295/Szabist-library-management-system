const express = require('express');
const router = express.Router();

// TEST REGISTER
router.post('/register', (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    res.json({
      success: true,
      message: "Register route hit successfully",
      data: req.body
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// TEST LOGIN
router.post('/login', (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    res.json({
      success: true,
      message: "Login route working",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;