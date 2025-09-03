const nodemailer = require('nodemailer');
const config = require('config');
const crypto = require('crypto');

const emailConfig = config.get('email');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.auth.user,
                pass: emailConfig.auth.pass
            }
        });
    }

    generateTemporaryPassword(length = 10) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        
        return password;
    }

    async sendPasswordResetEmail(userEmail, userName, temporaryPassword) {
        // For development/testing - check if using placeholder credentials
        const isTestMode = emailConfig.auth.user === 'your-email@gmail.com' || 
                          emailConfig.auth.pass === 'your-app-password';

        if (isTestMode) {
            // Mock email sending for development
            console.log('\n=== MOCK EMAIL SENT ===');
            console.log(`To: ${userEmail}`);
            console.log(`Subject: ${emailConfig.subject}`);
            console.log(`User: ${userName}`);
            console.log(`Temporary Password: ${temporaryPassword}`);
            console.log('========================\n');
            
            return { 
                success: true, 
                messageId: 'mock-' + Date.now(),
                testMode: true 
            };
        }

        // Real email sending for production
        const mailOptions = {
            from: emailConfig.from,
            to: userEmail,
            subject: emailConfig.subject,
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0066cc;">⛵ OrcaSail</h1>
                        <h2 style="color: #333;">איפוס סיסמה</h2>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <p style="margin: 0 0 10px 0; font-size: 16px;">שלום ${userName},</p>
                        <p style="margin: 0 0 10px 0;">קיבלנו בקשה לאיפוס הסיסמה שלך במערכת OrcaSail.</p>
                        <p style="margin: 0 0 10px 0;">הסיסמה הזמנית החדשה שלך היא:</p>
                        
                        <div style="background-color: #fff; padding: 15px; margin: 15px 0; border-radius: 5px; border: 2px solid #0066cc; text-align: center;">
                            <strong style="font-size: 18px; color: #0066cc; letter-spacing: 2px;">${temporaryPassword}</strong>
                        </div>
                        
                        <p style="margin: 0 0 10px 0; color: #e74c3c;"><strong>חשוב:</strong></p>
                        <ul style="margin: 0; padding-right: 20px; color: #666;">
                            <li>השתמש בסיסמה זו כדי להתחבר למערכת</li>
                            <li>מומלץ לשנות את הסיסמה לאחר ההתחברות</li>
                            <li>הסיסמה הזמנית בתוקף למשך 24 שעות</li>
                            <li>אם לא ביקשת איפוס זה, אנא צור קשר איתנו מיד</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; color: #666; font-size: 14px;">
                        <p>צוות OrcaSail</p>
                        <p>אם יש לך שאלות, אנא צור קשר איתנו</p>
                    </div>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('Email service connection verified successfully');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();