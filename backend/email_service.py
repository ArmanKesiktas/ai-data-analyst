"""
Email Service - Supports SendGrid and AWS SES
Configure via environment variables
"""
import os
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class EmailService:
    """Email sending service"""

    def __init__(self):
        self.provider = os.getenv("EMAIL_PROVIDER", "console")  # console, sendgrid, ses, smtp
        self.from_email = os.getenv("FROM_EMAIL", "noreply@yourdomain.com")
        self.from_name = os.getenv("FROM_NAME", "AI Data Analyst")

        # SendGrid
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")

        # AWS SES
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        # SMTP
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send email using configured provider

        Args:
            to_email: Recipient email
            subject: Email subject
            html_content: HTML content
            text_content: Plain text fallback (optional)

        Returns:
            True if sent successfully, False otherwise
        """
        if self.provider == "console":
            return self._send_console(to_email, subject, html_content)
        elif self.provider == "sendgrid":
            return self._send_sendgrid(to_email, subject, html_content, text_content)
        elif self.provider == "ses":
            return self._send_ses(to_email, subject, html_content, text_content)
        elif self.provider == "smtp":
            return self._send_smtp(to_email, subject, html_content, text_content)
        else:
            print(f"❌ Unknown email provider: {self.provider}")
            return False

    def _send_console(self, to_email: str, subject: str, html_content: str) -> bool:
        """Print email to console (development mode)"""
        print("\n" + "=" * 60)
        print("📧 EMAIL (Console Mode)")
        print("=" * 60)
        print(f"To: {to_email}")
        print(f"From: {self.from_name} <{self.from_email}>")
        print(f"Subject: {subject}")
        print("-" * 60)
        print(html_content)
        print("=" * 60 + "\n")
        return True

    def _send_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str]
    ) -> bool:
        """Send via SendGrid API"""
        if not self.sendgrid_api_key:
            print("❌ SENDGRID_API_KEY not configured")
            return False

        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )

            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)

            print(f"✅ Email sent via SendGrid: {response.status_code}")
            return True

        except ImportError:
            print("❌ SendGrid library not installed: pip install sendgrid")
            return False
        except Exception as e:
            print(f"❌ SendGrid error: {str(e)}")
            return False

    def _send_ses(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str]
    ) -> bool:
        """Send via AWS SES"""
        if not self.aws_access_key or not self.aws_secret_key:
            print("❌ AWS credentials not configured")
            return False

        try:
            import boto3

            ses = boto3.client(
                'ses',
                region_name=self.aws_region,
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key
            )

            response = ses.send_email(
                Source=f"{self.from_name} <{self.from_email}>",
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Html': {'Data': html_content},
                        'Text': {'Data': text_content or html_content}
                    }
                }
            )

            print(f"✅ Email sent via AWS SES: {response['MessageId']}")
            return True

        except ImportError:
            print("❌ Boto3 library not installed: pip install boto3")
            return False
        except Exception as e:
            print(f"❌ AWS SES error: {str(e)}")
            return False

    def _send_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str]
    ) -> bool:
        """Send via SMTP"""
        if not self.smtp_host or not self.smtp_username or not self.smtp_password:
            print("❌ SMTP credentials not configured")
            return False

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email

            # Add text and HTML parts
            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.smtp_use_tls:
                    server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            print(f"✅ Email sent via SMTP to {to_email}")
            return True

        except Exception as e:
            print(f"❌ SMTP error: {str(e)}")
            return False

    def send_workspace_invitation(
        self,
        to_email: str,
        workspace_name: str,
        inviter_name: str,
        invitation_url: str
    ) -> bool:
        """
        Send workspace invitation email

        Args:
            to_email: Recipient email
            workspace_name: Name of workspace
            inviter_name: Name of person who sent invitation
            invitation_url: URL to accept invitation

        Returns:
            True if sent successfully
        """
        subject = f"{inviter_name} invited you to join '{workspace_name}'"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                   color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white;
                   padding: 12px 30px; text-decoration: none; border-radius: 5px;
                   margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Workspace Invitation</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p><strong>{inviter_name}</strong> has invited you to join the workspace <strong>"{workspace_name}"</strong> on AI Data Analyst.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="{invitation_url}" class="button">Accept Invitation</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{invitation_url}</p>
            <p><em>This invitation will expire in 7 days.</em></p>
        </div>
        <div class="footer">
            <p>AI Data Analyst - Powered by Google Gemini</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
"""

        text_content = f"""
{inviter_name} has invited you to join the workspace "{workspace_name}"

Accept the invitation by visiting this link:
{invitation_url}

This invitation will expire in 7 days.

---
AI Data Analyst
If you didn't expect this invitation, you can safely ignore this email.
"""

        return self.send_email(to_email, subject, html_content, text_content)


# Global instance
email_service = EmailService()
