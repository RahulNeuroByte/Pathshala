import smtplib
from email.mime.text import MIMEText
from backend.core.config import settings
from backend.core.logging_config import logger

def send_smtp_email(to_email: str, subject: str, body: str, html_body: str = None):
    logger.info(f"[EMAIL PROCESS] Composing email to: {to_email} | Subject: {subject}")
    if html_body:
        logger.debug("[EMAIL PROCESS] Body Format: HTML Template active")
    else:
        logger.debug(f"[EMAIL PROCESS] Plain Body: {body}")
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("[EMAIL WARNING] SMTP credentials (SMTP_USER/SMTP_PASSWORD) not set in .env. Skipping real SMTP dispatch.")
        return False
        
    try:
        if html_body:
            msg = MIMEText(html_body, "html")
        else:
            msg = MIMEText(body)
            
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_SENDER or settings.SMTP_USER
        msg["To"] = to_email
        
        # Connect to SMTP server
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.ehlo()
            server.starttls()
            server.ehlo()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.close()
        logger.info("[EMAIL SUCCESS] Real SMTP email sent successfully!")
        return True
    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send real SMTP email: {e}", exc_info=True)
        return False

