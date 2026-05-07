const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const db = require('../models');

// Đường dẫn file hướng dẫn đính kèm
const GUIDE_FILE_PATH = path.join(__dirname, '../../uploads/documents/HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ SỞ Y TẾ HÀ NỘI.docx');
const GUIDE_FILE_NAME = 'HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN TRỊ SỞ Y TẾ HÀ NỘI.docx';

/** Trả về mảng attachments — rỗng nếu file không tồn tại */
function buildAttachments() {
  if (fs.existsSync(GUIDE_FILE_PATH)) {
    return [{ filename: GUIDE_FILE_NAME, path: GUIDE_FILE_PATH }];
  }
  console.warn('[EmailService] File hướng dẫn không tồn tại, bỏ qua attachment:', GUIDE_FILE_PATH);
  return [];
}

/**
 * Service to handle email sending using Nodemailer.
 */
class EmailService {
  /**
   * Get dynamic transporter from database configuration
   * @returns {Promise<object>}
   */
  async _getTransporter() {
    try {
      const config = await db.EmailConfirm.findOne({ order: [['created_at', 'DESC']] });
      if (config.smtp_host.includes('gmail.com')) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.smtp_user,
            pass: config.smtp_pass,
          },
        });
      }

      return nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_secure,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass,
        },
      });
    } catch (error) {
      console.error('Error fetching email configuration:', error);
      throw error;
    }
  }

  /**
   * Internal helper to send emails.
   */
  async _send(mailOptions) {
    try {
      const transporter = await this._getTransporter();
      const info = await transporter.sendMail(mailOptions);
      if (info.accepted && info.accepted.length > 0) {
        console.log('Email successfully sent to:', info.accepted[0]);
      }
      return info;
    } catch (error) {
      console.error('Error in sendMail:', error);
      throw error;
    }
  }

  /**
   * Send a password confirmation email to a new user.
   * @param {object} user - The user object containing email and username.
   * @param {string} confirmLink - The full confirmation link.
   * @returns {Promise}
   */
  async sendPasswordConfirmation(user, confirmLink) {
    const mailOptions = {
      from: `Sở Y Tế Hà Nội`,
      to: user.email,
      subject: 'Xác nhận mật khẩu - Sở Y Tế Hà Nội',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Chào ${user.full_name || user.username || 'bạn'},</h2>
          <p>Tài khoản của bạn đã được khởi tạo thành công trên hệ thống của Sở Y Tế Hà Nội.</p>
          <p>Vui lòng click vào liên kết bên dưới để xác nhận mật khẩu và kích hoạt tài khoản của bạn:</p>
          <p>
            <a href="${confirmLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
              Xác nhận mật khẩu
            </a>
          </p>
          <p>Nếu nút trên không hoạt động, bạn có thể copy và dán liên kết sau vào trình duyệt:</p>
          <p>${confirmLink}</p>
          <p>Liên kết xác thực này sẽ hết hạn sau <strong>24 giờ</strong>.</p>
          <p>Sau khi xác thực tài khoản vui lòng đăng nhập vào đường link này: suckhoethudo.vn</p>
          <br>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ kỹ thuật.</p>
        </div>
      `,
      attachments: buildAttachments(),
    };

    return this._send(mailOptions);
  }

  /**
   * Send a reset password email to existing user.
   * @param {object} user - The user object.
   * @param {string} resetLink - The full reset link.
   * @returns {Promise}
   */
  async sendResetPasswordEmail(user, resetLink) {
    const mailOptions = {
      from: `Sở Y Tế Hà Nội`,
      to: user.email,
      subject: 'Đặt lại mật khẩu - Sở Y Tế Hà Nội',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Chào ${user.full_name || user.username || 'bạn'},</h2>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại hệ thống của Sở Y Tế Hà Nội.</p>
          <p>Vui lòng click vào liên kết bên dưới để tiến hành thay đổi mật khẩu:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p>Vì lý do bảo mật, liên kết này sẽ chỉ có hiệu lực trong vòng <strong>1 giờ</strong>.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
          <p>Nếu nút trên không hoạt động, bạn có thể copy và dán liên kết sau vào trình duyệt:</p>
          <p>${resetLink}</p>
          <p>Sau khi xác thực tài khoản vui lòng đăng nhập vào đường link này: suckhoethudo.vn</p>
          <br>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ kỹ thuật.</p>
        </div>
      `,
      attachments: buildAttachments(),
    };

    return this._send(mailOptions);
  }
}

module.exports = new EmailService();
