const address = "http://127.0.0.1:8000/";

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
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    event.preventDefault();
  
    // values
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    fetch(`${address}/emails`, {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body,
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
    });
    
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  });
}



function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch the emails for the specified mailbox
  fetch(`${address}/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      const emailsView = document.querySelector('#emails-view');

      // Clear previous content
      emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

      // Check if there are any emails
      if (emails.length === 0) {
        const messageElement = document.createElement('div');
        messageElement.style.border = 'solid';
        messageElement.style.padding = '10px';
        messageElement.innerHTML = "No email";
        emailsView.appendChild(messageElement);
      } else {
        emails.forEach(email => {
          const emailElement = document.createElement('div');
          emailElement.style.border = 'solid';
          emailElement.style.padding = '10px';
          emailElement.innerHTML = `
            <strong>${email.sender}</strong> 
            <strong> | ${email.subject} | </strong> 
            <small>${email.timestamp}</small>
          `;
          emailsView.appendChild(emailElement);
        });
      }
    })
    .catch(error => {
      console.log('Error fetching emails:', error);
      const errorElement = document.createElement('div');
      errorElement.style.border = 'solid';
      errorElement.style.padding = '10px';
      errorElement.innerHTML = "Failed to load emails.";
      document.querySelector('#emails-view').appendChild(errorElement);
    });
}