class NotificationService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        print("\n" + "="*50)
        print(f"📧 EMAIL SENT TO: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print("="*50 + "\n")
        return True

    @staticmethod
    def send_sms(to_phone: str, message: str):
        print("\n" + "="*50)
        print(f"📱 SMS SENT TO: {to_phone}")
        print(f"Message: {message}")
        print("="*50 + "\n")
        return True
