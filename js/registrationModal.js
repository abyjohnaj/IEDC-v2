/* Event Registration & Startup Idea Submission Modal */

function openRegistrationModal(eventName = "") {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  
  if (!modalOverlay || !modalContainer) return;
  
  const isIdeaSubmission = !eventName || eventName === "IdeaPitch";
  const modalTitle = isIdeaSubmission ? "Submit Your Startup Idea" : `Register for ${eventName}`;
  const modalSub = isIdeaSubmission 
    ? "Pitch your concept to IEDC BMCE to get seed funding support, mentorship, and prototyping lab access." 
    : "Fill out your details below to reserve your slot in this upcoming IEDC workshop.";
    
  modalContainer.innerHTML = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div style="margin-bottom: 1.5rem;">
      <span class="badge-tag">${isIdeaSubmission ? 'Incubation Portal' : 'Event Pass'}</span>
      <h2 style="font-size: 1.8rem; margin-top: 0.5rem; margin-bottom: 0.3rem;" class="gradient-text">${modalTitle}</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">${modalSub}</p>
    </div>
    
    <form id="iedc-modal-form" onsubmit="handleModalSubmit(event, '${isIdeaSubmission ? 'Idea' : 'Event'}', '${eventName || ''}')">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input type="text" name="fullName" class="form-input" placeholder="e.g. Rahul Sharma" required />
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input type="email" name="email" class="form-input" placeholder="name@bmce.ac.in" required />
        </div>
        <div class="form-group">
          <label class="form-label">Phone / WhatsApp *</label>
          <input type="tel" name="phone" class="form-input" placeholder="+91 98765 43210" required />
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Department & Year *</label>
          <select name="department" class="form-select" required>
            <option value="">Select Branch</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="EEE">Electrical (EEE)</option>
            <option value="CE">Civil Engineering (CE)</option>
            <option value="ME">Mechanical Engineering (ME)</option>
            <option value="AIDS">Artificial Intelligence (AI&DS)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Semester</label>
          <select name="semester" class="form-select">
            <option value="S1/S2">S1 / S2</option>
            <option value="S3/S4">S3 / S4</option>
            <option value="S5/S6">S5 / S6</option>
            <option value="S7/S8">S7 / S8</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">${isIdeaSubmission ? 'Startup Idea Title & Brief Overview *' : 'Why do you want to attend? *'}</label>
        <textarea name="overviewReason" class="form-textarea" rows="3" placeholder="${isIdeaSubmission ? 'Describe the problem you are solving and your solution...' : 'Tell us what you hope to learn or achieve...'}" required></textarea>
      </div>
      
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">
          Submit ${isIdeaSubmission ? 'Idea' : 'Registration'}
        </button>
      </div>
    </form>
  `;
  
  modalOverlay.classList.add('active');
}

function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

async function handleModalSubmit(event, type, eventName = '') {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const regData = {
    type: type,
    eventName: eventName,
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    department: formData.get('department'),
    semester: formData.get('semester'),
    overviewReason: formData.get('overviewReason')
  };

  closeModal();

  if (typeof sbSubmitRegistration === 'function') {
    await sbSubmitRegistration(regData);
  }

  showToast(`✅ Success! Your ${type} request has been submitted to IEDC BMCE.`);
}

function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
