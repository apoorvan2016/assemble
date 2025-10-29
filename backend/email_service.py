import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', 'balajismtptest@gmail.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'mshx pahg bjlw yhaw')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USERNAME)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(to_email, otp, username):
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logger.error("SMTP credentials not configured")
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Verify Your Email - Assemble Platform'
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email

        text = f"""
        Hi {username},

        Welcome to Assemble! Please verify your email address using the OTP below:

        OTP: {otp}

        This OTP will expire in 10 minutes.

        If you didn't request this, please ignore this email.

        Best regards,
        Assemble Team
        """

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4F46E5;">Welcome to Assemble!</h2>
                <p>Hi {username},</p>
                <p>Please verify your email address using the OTP below:</p>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #4F46E5; font-size: 36px; margin: 0; letter-spacing: 8px;">{otp}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">Best regards,<br>Assemble Team</p>
            </div>
        </body>
        </html>
        """

        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"OTP email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send OTP email: {type(e).__name__}: {str(e)}")
        return False
