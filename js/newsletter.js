/* Eureka Newsletter Modal Engine */

function openNewsletterModal(pdfUrl) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  
  if (!modalOverlay || !modalContainer) return;
  
  modalContainer.innerHTML = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div style="text-align: center; padding-bottom: 1rem;">
      <span class="eureka-badge">Official IEDC Publication</span>
      <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;" class="gradient-text">Eureka Newsletter</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">Inspiring innovation, campus startup stories, and technical achievements at BMCE.</p>
    </div>
    
    <div style="border-radius: var(--radius-md); overflow: hidden; background: #0f172a; border: 1px solid var(--border-color); height: 420px; position: relative;">
      <iframe src="https://online.fliphtml5.com/vaxbbp/iipw/" style="width: 100%; height: 100%; border: none;" title="Eureka Newsletter Reader"></iframe>
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
      <a href="https://drive.google.com/file/d/13no5SZQYDedneQpACfbn5kVUEQdsvB2C/view?usp=sharing" target="_blank" class="btn btn-primary">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        Open PDF Drive Edition
      </a>
      <button class="btn btn-secondary" onclick="closeModal()">Close Reader</button>
    </div>
  `;
  
  modalOverlay.classList.add('active');
}
