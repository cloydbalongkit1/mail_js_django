let url;
document.addEventListener('DOMContentLoaded', function() {
  url = window.location.href;

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});



function compose_email(content, reply='') {

  if (typeof content.sender !== 'string') {
      content.sender = '';
  }
  console.log(content.subject); // Checking the subject on console

  // Display compose view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email_content-view').style.display = 'none';

  // Set recipients and subject
  document.querySelector('#compose-recipients').value = content.sender;
  if (content.subject) {
      if (content.subject.startsWith('RE:')) {
          document.querySelector('#compose-subject').value = content.subject;
      } else {
          document.querySelector('#compose-subject').value = `RE: ${content.subject}`;
      }
  } else {
      document.querySelector('#compose-subject').value = '';
  }

  // Set the body of the email
  if (reply !== 'reply') {
      document.querySelector('#compose-body').value = '';
  } else {
      document.querySelector('#compose-body').value = 
          `\nOn ${content.timestamp}, ${content.sender} wrote: ${content.body}`;
  }

  // Form submission handler
  const form = document.querySelector('#compose-form');
  // Remove any existing event listeners to prevent multiple submissions
  form.removeEventListener('submit', handleSubmit);
  form.addEventListener('submit', handleSubmit);

  // Define the form submission handler
  function handleSubmit(event) {
      event.preventDefault(); // Prevent default form submission

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
      .then(response => response.json()) // Checking the backend response
      .then(data => {
          console.log(data);
          // Clear the form fields
          document.querySelector('#compose-recipients').value = '';
          document.querySelector('#compose-subject').value = '';
          document.querySelector('#compose-body').value = '';
          // Load the inbox
          load_mailbox('inbox');
      });
  }
}



function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email_content-view').style.display = 'none';

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

          if (email.read && mailbox !== 'sent') { // && mailbox !== 'archive'
            emailElement.style.backgroundColor = '#B7B7B7';
          } else {
            emailElement.style.backgroundColor = '#f9f9f9';
          }

          emailElement.innerHTML = 
            `
              <div class="email-info">
                <strong>From: ${email.sender}</strong> 
              </div>
              <div class="email-subject">
                <p><strong>Subject:</strong> ${email.subject}</p> 
              </div>
              <div class="email-timestamp">
                <small>${email.timestamp}</small>
              </div>
            `;

          emailElement.addEventListener('click', () => email_clicked(email.id, mailbox));
          emailsView.appendChild(emailElement);
        });
      }
    })
    .catch(error => {
      console.log('Error fetching emails:', error); // backend not load

      const errorElement = document.createElement('div');
      errorElement.classList.add('email-boxes');

      errorElement.innerHTML = "Failed to load emails.";
      document.querySelector('#emails-view').appendChild(errorElement);
    });
}



//functions supports each other

function email_clicked(email_id, mailbox) {
  fetch(`${url}/emails/${email_id}`)
      .then(response => response.json())
      .then((content) => {
          display_email_content(content, mailbox);
          mark_email_as_read(email_id);
      });
}


function display_email_content(content, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email_content-view').style.display = 'block';

  const contentElementParent = document.getElementById('email_content-view'); // previous will not be not seen
  contentElementParent.innerHTML = '';
  
  const contentElement = document.createElement('div');
  contentElement.innerHTML = 
    `
      <p><strong>From:</strong> ${content.sender}</p>
      <p><strong>To:</strong> ${content.recipients}</p>
      <p><strong>Subject:</strong> ${content.subject}</p>
      <p><strong>Timestamp:</strong> ${content.timestamp}</p>
      
      <button class="btn btn-primary reply-button">Reply</button>
      <button class="ml-2 btn btn-outline-info archive-button">Archive</button>
      <hr>
      <div style="white-space: pre-wrap;">${content.body}</div>
    `;
  contentElementParent.appendChild(contentElement);

  if (mailbox === 'sent') {
      hide_buttons(['.reply-button', '.archive-button']);
  }
  add_event_listeners(content, mailbox);
}


function hide_buttons(buttonClasses) {
  buttonClasses.forEach(buttonClass => {
      const buttonElement = document.querySelector(buttonClass);
      if (buttonElement) {
          buttonElement.classList.add('hide-button');
      }
  });
}


function add_event_listeners(content, mailbox) {
    const archiveButton = document.querySelector('.archive-button');
    const replyButton = document.querySelector('.reply-button');

    // Remove existing event listeners by cloning and replacing
    const newArchiveButton = archiveButton.cloneNode(true);
    archiveButton.replaceWith(newArchiveButton);
    const newReplyButton = replyButton.cloneNode(true);
    replyButton.replaceWith(newReplyButton);

    // Set up archive button (unarchive @ archive mailbox)
    if (mailbox === 'archive') {
        newArchiveButton.innerHTML = 'Unarchive';
        newArchiveButton.addEventListener('click', () => {
            console.log('Unarchive Clicked'); // ----> Checking button is clicked
            fetch(`${url}/emails/${content.id}`, {
                method: 'PUT',
                body: JSON.stringify({ archived: false })
            })
            .then(() => {
                alert(`${content.subject} is successfully returned to inbox.`);
                return load_mailbox('inbox');
            });
        });
    } else { // regular archive button (inbox)
        newArchiveButton.addEventListener('click', () => {
            console.log('Archive Clicked'); // ----> Checking button is clicked
            fetch(`${url}/emails/${content.id}`, {
                method: 'PUT',
                body: JSON.stringify({ archived: true })
            })
            .then(() => {
                alert(`${content.subject} is successfully added to the archived folder.`);
                return load_mailbox('archive');
            });
        });
    }

    newReplyButton.addEventListener('click', () => {
        compose_email(content, 'reply');
    });
}


function mark_email_as_read(email_id) {
  return fetch(`${url}/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
    .then(response => {
      if (response.ok) {
          console.log(`Email ${email_id} read successfully.`);
      } else {
          console.log(`Failed to read email ${email_id}.`);
      }
    });
  }

