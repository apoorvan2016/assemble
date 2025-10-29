
import smtplib

server = smtplib.SMTP("smtp.gmail.com", 587)
server.starttls()
server.login("balajismtptest@gmail.com", "mshx pahg bjlw yhaw")
print("✅ Login OK")
server.quit()
