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

// SendInvitationEmail notifies the invitee that they have been invited to a workspace.
// invitationID is included in the URL so the email deep-links to /invite/{id}.
func (s *EmailService) SendInvitationEmail(to, inviterName, workspaceName, invitationID string) error {
	appURL := strings.TrimSpace(os.Getenv("FRONTEND_ORIGIN"))
	if appURL == "" {
		appURL = "https://app.multica.ai"
	}
	inviteURL := fmt.Sprintf("%s/invite/%s", appURL, invitationID)

	subject := fmt.Sprintf("%s invited you to %s on Multica", inviterName, workspaceName)
	html := fmt.Sprintf(
		`<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
			<h2>You're invited to join %s</h2>
			<p><strong>%s</strong> invited you to collaborate in the <strong>%s</strong> workspace on Multica.</p>
			<p style="margin: 24px 0;">
				<a href="%s" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">Accept invitation</a>
			</p>
			<p style="color: #666; font-size: 14px;">You'll need to log in to accept or decline the invitation.</p>
		</div>`, workspaceName, inviterName, workspaceName, inviteURL)

	if s.smtpHost != "" {
		return s.sendSMTP(to, subject, html)
	}
	if s.resendClient != nil {
		return s.sendResend(to, subject, html)
	}
	fmt.Printf("[DEV] Invitation email to %s: %s invited you to %s — %s\n", to, inviterName, workspaceName, inviteURL)
	return nil
}
