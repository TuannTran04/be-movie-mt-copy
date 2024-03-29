const nodemailer = require("nodemailer");

// Tạo một đối tượng transporter với các thông tin cấu hình SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tuantrann0402@gmail.com", // Địa chỉ email của bạn
    pass: "ykmzmkwgdoxvoaos", // Mật khẩu của bạn
  },
});

const OTP_EXPIRATION_SECONDS = 1000;

const sendEmail = async (email, username, otp) => {
  try {
    await new Promise((resolve, reject) => {
      // verify connection configuration
      transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          console.log("Server is ready to take our messages");
          resolve(success);
        }
      });
    });

    // Cấu hình email thông báo đến người dùng
    const mailOptions = {
      from: "tuantrann0402@gmail.com",
      to: email, // Địa chỉ email của người dùng
      subject: "Your OTP for Registration", // Tiêu đề email
      html: `
          <p>Xin chào ${username}</p>
          <p>Cảm ơn bạn đã sử dụng web xem phim của chúng tôi – đỜ Tôn.</p>
          <p>Mã OTP của bạn là: ${otp}</p>
          <p>Thời gian tồn tại OTP: ${OTP_EXPIRATION_SECONDS}s</p>
          <p>Chúng tôi mong bạn có cuộc trải nghiệm xem phim vui vẻ.</p>
          <p>Trân trọng.</p>
          `, // Nội dung email
    };

    // Gửi email thông báo đến người dùng
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          console.log(info);
          console.log("Email sent: " + info.response);
          resolve(info);
        }
      });
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
