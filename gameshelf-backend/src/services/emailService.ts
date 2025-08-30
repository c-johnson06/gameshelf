import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email transporter setup
const createTransporter = () => {
    if (process.env.NODE_ENV === 'production') {
        // Production email service (e.g., SendGrid, AWS SES, etc.)
        return nodemailer.createTransport({
            service: 'SendGrid', // or your preferred service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Development - use Ethereal Email (temporary testing emails)
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
                pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
            }
        });
    }
};

// Generate verification token
export const generateVerificationToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (
    email: string, 
    username: string, 
    token: string
): Promise<void> => {
    const transporter = createTransporter();
    
    const verificationUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.FRONTEND_URL}/verify-email?token=${token}`
        : `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@gameshelf.com',
        to: email,
        subject: 'Welcome to GameShelf - Verify your email',
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎮 GameShelf</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Gaming Library Awaits</p>
                </div>
                
                <div style="padding: 40px 20px; background: white;">
                    <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${username}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Thanks for joining GameShelf! We're excited to have you as part of our gaming community.
                        To get started, please verify your email address by clicking the button below.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  text-decoration: none; 
                                  padding: 15px 30px; 
                                  border-radius: 8px; 
                                  font-weight: bold; 
                                  display: inline-block;">
                            Verify My Email
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
                    </p>
                    
                    <p style="color: #999; font-size: 14px; margin-top: 30px;">
                        This verification link will expire in 24 hours. If you didn't create an account with GameShelf, 
                        you can safely ignore this email.
                    </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} GameShelf. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 Verification email sent!');
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
        }
    } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

// Send password reset email (bonus feature)
export const sendPasswordResetEmail = async (
    email: string, 
    username: string, 
    token: string
): Promise<void> => {
    const transporter = createTransporter();
    
    const resetUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.FRONTEND_URL}/reset-password?token=${token}`
        : `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@gameshelf.com',
        to: email,
        subject: 'GameShelf - Reset your password',
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎮 GameShelf</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
                </div>
                
                <div style="padding: 40px 20px; background: white;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hi ${username},</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  text-decoration: none; 
                                  padding: 15px 30px; 
                                  border-radius: 8px; 
                                  font-weight: bold; 
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 14px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                    </p>
                    
                    <p style="color: #999; font-size: 14px; margin-top: 30px;">
                        This reset link will expire in 1 hour. If you didn't request a password reset, 
                        you can safely ignore this email.
                    </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} GameShelf. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 Password reset email sent!');
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
        }
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};