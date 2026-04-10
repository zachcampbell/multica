package service

import (
	"fmt"
	"net/smtp"
	"os"
	"strings"

	"github.com/resend/resend-go/v2"
)

type EmailService struct {
	resendClient *resend.Client
	smtpHost     string // SMTP server hostname
	smtpPort     string // SMTP port (default: 25)
	fromEmail    string
}

func NewEmailService() *EmailService {
	from := os.Getenv("RESEND_FROM_EMAIL")
	if from == "" {
		from = os.Getenv("SMTP_FROM")
	}
	if from == "" {
		from = "noreply@multica.ai"
	}

	svc := &EmailService{fromEmail: from}

	// Prefer SMTP if configured, then Resend, then dev stdout.
	if host := os.Getenv("SMTP_HOST"); host != "" {
		svc.smtpHost = host
		svc.smtpPort = os.Getenv("SMTP_PORT")
		if svc.smtpPort == "" {
			svc.smtpPort = "25"
		}
	} else if apiKey := os.Getenv("RESEND_API_KEY"); apiKey != "" {
		svc.resendClient = resend.NewClient(apiKey)
	}

	return svc
}

func (s *EmailService) SendVerificationCode(to, code string) error {
	html := fmt.Sprintf(
		`<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
			<h2>Your verification code</h2>
			<p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">%s</p>
			<p>This code expires in 10 minutes.</p>
			<p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
		</div>`, code)

	if s.smtpHost != "" {
		return s.sendSMTP(to, "Your Multica verification code", html)
	}

	if s.resendClient != nil {
		return s.sendResend(to, "Your Multica verification code", html)
	}

	// Dev fallback
	fmt.Printf("[DEV] Verification code for %s: %s\n", to, code)
	return nil
}

func (s *EmailService) sendSMTP(to, subject, htmlBody string) error {
	var msg strings.Builder
	msg.WriteString("From: " + s.fromEmail + "\r\n")
	msg.WriteString("To: " + to + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := s.smtpHost + ":" + s.smtpPort

	// Use plain SMTP (no STARTTLS requirement) for internal MTAs.
	c, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("smtp dial: %w", err)
	}
	defer c.Close()

	if err := c.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("smtp mail: %w", err)
	}
	if err := c.Rcpt(to); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}
	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := w.Write([]byte(msg.String())); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("smtp close: %w", err)
	}
	return c.Quit()
}

func (s *EmailService) sendResend(to, subject, htmlBody string) error {
	_, err := s.resendClient.Emails.Send(&resend.SendEmailRequest{
		From:    s.fromEmail,
		To:      []string{to},
		Subject: subject,
		Html:    htmlBody,
	})
	return err
}
