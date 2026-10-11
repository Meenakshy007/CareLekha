# WhatsApp daily medicine reminders

CareLekha can schedule daily WhatsApp medicine reminders from the completed routine. Reminders are sent by the Safety API worker using the official Meta WhatsApp Business Cloud API.

## Required setup (one-time)

1. Create/configure a Meta Business portfolio, WhatsApp Business Account, and business phone number.
2. Create an approved **utility** message template in Malayalam named to match `WHATSAPP_TEMPLATE_NAME`. Its body must have exactly two text placeholders: `{{1}}` (time-of-day label) and `{{2}}` (the medicines scheduled for that time). Example body:

   `CareLekha ഓർമ്മപ്പെടുത്തൽ: {{1}} സമയത്ത് ക്രമീകരിച്ചിരിക്കുന്ന മരുന്നുകൾ: {{2}}. ഡോക്ടറുടെ കുറിപ്പടിയനുസരിച്ച് മാത്രം മരുന്ന് കഴിക്കുക. സംശയമുണ്ടെങ്കിൽ ഡോക്ടറെയോ ഫാർമസിസ്റ്റിനെയോ സമീപിക്കുക.`

3. Copy `backend/safety/.env.example` to `backend/safety/.env` and fill in the Meta access token, phone-number ID, approved template name/language, and supported Graph API version. Never commit `.env` or share its secrets.
4. Install updated Safety requirements with `pip install -r requirements.txt`, then restart the Safety API.

## Runtime behavior

- The caregiver must enter the recipient's full international phone number and explicitly opt in.
- The complete routine must be generated first. For each populated time group (morning, afternoon, evening, night), the caregiver selects an actual clock time.
- The Safety API stores the recurring daily jobs in a local SQLite database and sends the approved template at each selected clock time in the chosen timezone (the frontend currently uses `Asia/Kolkata`).
- Reminders are recurring every day until replaced or disabled by the API.
- The local background worker is intended for one Safety API process. Use a separate durable worker/queue for multi-worker or production hosting.
- WhatsApp API delivery depends on a valid business setup, template approval, token permissions, recipient opt-in, network availability, and Meta delivery status. Saving a job means it is scheduled locally, not that WhatsApp has delivered a message.

## Privacy and safety

The reminder database contains phone numbers and medication schedule text. It is ignored by Git, but should still be protected on the host and deleted when no longer needed. Only send messages to a number whose owner has explicitly consented. Reminder messages repeat user-confirmed schedule data; they are not medical advice and should never be used to resolve ambiguous prescription instructions.

## API endpoints

- `POST /reminders/whatsapp` — save/replace daily reminders for a consenting recipient.
- `POST /reminders/whatsapp/disable` — stop future reminders for the supplied number.
