const express = require("express");
const router = express.Router();
const Joi = require("joi");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");
const authenticate = require("../api/authMiddleware");
const gravatar = require("gravatar");
const nodemailer = require("nodemailer");
const nodemailerConfig = require("../../config/nodemail");
require("dotenv").config();



const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Register
(async () => {
  const { nanoid } = await import("nanoid");
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Înregistrează un nou utilizator
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       201:
   *         description: Înregistrare reușită
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 code:
   *                   type: integer
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                     user:
   *                       type: object
   *                       properties:
   *                         email:
   *                           type: string
   *                         verify:
   *                           type: boolean
   *       400:
   *         description: Cerere invalidă
   *       409:
   *         description: Email deja utilizat
   *       500:
   *         description: Eroare server
   */

  router.post("/register", async (req, res) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: error.details[0].message,
        data: "Bad Request at Joi Library",
      });
    }

    const { username, email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          code: 409,
          message: "Email already in use",
          data: "Conflict",
        });
      }

      const verificationToken = nanoid();

      const newUser = new User({
        username,
        email,
        avatarURL: gravatar.url(email),
        verificationToken,
      });

      await newUser.setPassword(password);
      await newUser.save();

      const transporter = nodemailer.createTransport(nodemailerConfig);
      const emailOptions = {
        from: process.env.OUTLOOK_EMAIL,
        to: email,
        subject: "Nodemailer test",
        text: "Testare de email registration",
        html: `<p>Click <a href="${process.env.BASE_URL}/food/users/verify/${verificationToken}">here</a> to verify your email address.</p>`,
      };

      try {
        await transporter.sendMail(emailOptions);
        return res.status(201).json({
          status: "success",
          code: 201,
          data: {
            message:
              "Registration successful. Please check your email to verify your account.",
            user: {
              email: newUser.email,
              verify: newUser.verify,
            },
          },
        });
      } catch (err) {
        console.log("Failed to send email:", err);
        return res.status(201).json({
          status: "success",
          code: 201,
          data: {
            message:
              "Registration successful. Please check your email to verify your account. However, email sending failed.",
            user: {
              email: newUser.email,
              verify: newUser.verify,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Bad Request", message: error.message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
})();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentifică un utilizator existent
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autentificare reușită
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *       400:
 *         description: Cerere invalidă
 *       401:
 *         description: Email sau parolă incorectă
 *       403:
 *         description: Email neconfirmat
 *       500:
 *         description: Eroare server
 */

router.post("/login", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: error.details[0].message,
      data: "Bad Request at Joi Library",
    });
  }

  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists and password is valid
    if (!user || !(await user.isValidPassword(password))) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Incorrect email or password",
        data: {
          message: "Bad Request",
        },
      });
    }

    // Check if email is verified
    if (!user.verify) {
      return res.status(403).json({
        status: "error",
        code: 403,
        message: "Email not verified",
        data: {
          message: "Please verify your email before logging in",
        },
      });
    }

    // Create JWT payload and generate token
    const payload = {
      id: user.id,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Respond with token and user details
    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        token,
        refreshToken,
        user: {
          username: user.username,
          email: user.email,
          dailyKcal: user.dailyKcal,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Internal Server Error",
      data: {
        message: "An unexpected error occurred",
        error: error.message,
      },
    });
  }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Deconectează utilizatorul autentificat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deconectare reușită
 *       401:
 *         description: Neautorizat
 *       500:
 *         description: Eroare server
 */
router.post("/logout", authenticate, async (req, res) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "error",
      code: 401,
      message: "Unauthorized",
      data: {
        message: "No token provided",
      },
    });
  }

  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: {
          message: "User not found",
        },
      });
    }

    await user.removeToken(token);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Internal Server Error",
    });
  }
});

/**
 * @swagger
 * /current:
 *   get:
 *     summary: Obține datele utilizatorului autentificat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datele utilizatorului
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *
 *       401:
 *         description: Neautorizat
 *       500:
 *         description: Eroare server
 */
router.get("/current", authenticate, async (req, res) => {
  const user = req.user;
  res.status(200).json({
    username: user.username,
  });
});

// Update the user's avatar.

/**
 * @swagger
 * /avatars:
 *   patch:
 *     summary: Actualizează avatarul utilizatorului autentificat
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar actualizat cu succes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 avatarURL:
 *                   type: string
 *       500:
 *         description: Eroare server
 */




router.post("/dailyKcal", authenticate, async (req, res) => {
  const { kcal } = req.body;

  if (typeof kcal !== 'number' || kcal <= 0) {
    return res.status(400).json({ message: 'Invalid kcal value' });
  }

  try {
    const user = req.user;
    user.dailyKcal = kcal;
    await user.save();

    res.status(200).json({ message: 'Daily kcal updated successfully', dailyKcal: user.dailyKcal });
  } catch (error) {
    console.error("Error updating daily kcal:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Send email
/**
 * @swagger
 * /verify:
 *   post:
 *     summary: Trimite un email de verificare
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Email de verificare trimis
 *       500:
 *         description: Eroare server
 */

router.post("/verify", async (req, res) => {
  const { email } = req.body;

  const transporter = nodemailer.createTransport(nodemailerConfig);
  const emailOptions = {
    from: process.env.OUTLOOK_EMAIL,
    to: email,
    subject: "Nodemailer test",
    text: "Hello. We are testing sending emails!",
  };

  try {
    await transporter.sendMail(emailOptions);
    res.status(201).json({
      status: "success",
      code: 201,
      data: { message: "Verification email sent" },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// Get user verify email

/**
 * @swagger
 * /verify/{verificationToken}:
 *   get:
 *     summary: Verifică utilizatorul cu tokenul de verificare
 *     tags: [User]
 *     parameters:
 *       - name: verificationToken
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verificare reușită
 *       400:
 *         description: Utilizator deja verificat
 *       404:
 *         description: Utilizator nencontrat
 *       500:
 *         description: Eroare server
 */

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;
  console.log(`Received verificationToken: ${verificationToken}`);

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({ message: "User already verified" });
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error("Error during verification:", error);
    res.status(500).json({ message: error.message });
  }
});

// Change verification token in true

/**
 * @swagger
 * /test-verify:
 *   post:
 *     summary: Testează verificarea utilizatorului cu tokenul de verificare
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               verificationToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verificare reușită
 *       400:
 *         description: Token de verificare invalid
 *       404:
 *         description: Utilizator nencontrat
 *       500:
 *         description: Eroare server
 */

router.post("/test-verify", async (req, res) => {
  console.log("Received request body:", req.body);
  const { email, verificationToken } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationToken !== verificationToken) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.verify = true;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error("Error during verification:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /resend-verify:
 *   post:
 *     summary: Retrimite emailul de verificare
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de verificare retrimis
 *       400:
 *         description: Email deja verificat
 *       404:
 *         description: Utilizator nencontrat
 *       500:
 *         description: Eroare server
 */

router.post("/resend-verify", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Missing required field: email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.verify) {
      return res.status(400).json({
        message: "Verification has already been passed",
      });
    }

    const { nanoid } = await import("nanoid");
    const verificationToken = nanoid();
    user.verificationToken = verificationToken;
    await user.save();

    const transporter = nodemailer.createTransport(nodemailerConfig);
    const emailOptions = {
      from: process.env.OUTLOOK_EMAIL,
      to: email,
      subject: "Verify Your Email Address",
      text: "Please verify your email address.",
      html: `<p>Click <a href="${process.env.BASE_URL}/food/users/verify/${verificationToken}">here</a> to verify your email address.</p>`,
    };

    try {
      await transporter.sendMail(emailOptions);
      res.status(200).json({
        message: "Verification email sent",
      });
    } catch (err) {
      console.log("Failed to send email:", err);
      res.status(500).json({
        message: "Failed to send verification email",
      });
    }
  } catch (err) {
    console.error("Error during verification email request:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Refresh token route
router.post("/auth/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

module.exports = router;
