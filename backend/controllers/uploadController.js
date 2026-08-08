const uploadProfile = async (req, res) => {
  try {
    const { name, email, phone, age } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile uploaded successfully",

      data: {
        name,
        email,
        phone,
        age,
        image: req.file.filename,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadProfile,
};