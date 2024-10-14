const url = "http://127.0.0.1:8000/";

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});



function compose_email() {
  
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-form').addEventListener('submit', function(event) {

    // JS will handle the forms input not the backend part. Or return false at the end.
    event.preventDefault();

    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    fetch(`${url}/emails`, {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
        })
    })
    .then(response => response.json())
    
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    load_mailbox('inbox')
  });
}



function load_mailbox(mailbox) {
  
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`${url}/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      const emailsView = document.querySelector('#emails-view');

      if (emails.length === 0) {

        const messageElement = document.createElement('div');
        messageElement.classList.add('email-boxes');

        messageElement.innerHTML = "No email";
        emailsView.appendChild(messageElement);

      } else {

        emails.forEach(email => {
          const emailElement = document.createElement('div');
          emailElement.classList.add('email-boxes');

          emailElement.innerHTML = `
            <div class="email-info">
              <strong>${email.sender}</strong> 
            </div>
            <div class="email-subject">
              <p>${email.subject}</p> 
            </div>
            <div class="email-timestamp">
              <small>${email.timestamp}</small>
            </div>
          `;

          emailElement.addEventListener('click', () => email_clicked(email.id));
          emailsView.appendChild(emailElement);
        });
      }
    })
    .catch(error => {
      console.log('Error fetching emails:', error);

      const errorElement = document.createElement('div');
      errorElement.classList.add('email-boxes');

      errorElement.innerHTML = "Failed to load emails.";
      document.querySelector('#emails-view').appendChild(errorElement);
    });
}



function email_clicked(email_id) {
    // alert("testing")
    // console.log(email_id);

    fetch(`${url}/emails/${email_id}`)
      .then(response => response.json())
      .then(() => {
        return fetch(`${url}/emails/${email_id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                  read: true
                })
              })
      .then( response => {
        if (response.ok) {
          console.log(`Email ${email_id} read successfully.`);
        } else {
          console.log(`Failed to read email ${email_id}.`);
        }
      })

      
    });
}