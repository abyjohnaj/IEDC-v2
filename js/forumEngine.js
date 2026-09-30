/* Community Forum & Collaboration Logic Engine */

let currentChannel = 'All';
let searchQuery = '';
let forumState = [];

document.addEventListener('DOMContentLoaded', () => {
  initForumState();
  renderForumDiscussions();
});

async function initForumState() {
  if (typeof sbFetchDiscussions === 'function') {
    const liveThreads = await sbFetchDiscussions();
    if (liveThreads && Array.isArray(liveThreads)) {
      forumState = liveThreads.length > 0 ? liveThreads : [...initialForumDiscussions];
      renderForumDiscussions();
      return;
    }
  }

  const saved = localStorage.getItem('iedc-forum-discussions');
  if (saved) {
    try {
      forumState = JSON.parse(saved);
    } catch (e) {
      forumState = [...initialForumDiscussions];
    }
  } else {
    forumState = [...initialForumDiscussions];
    saveForumState();
  }
}

function saveForumState() {
  localStorage.setItem('iedc-forum-discussions', JSON.stringify(forumState));
}

function filterForumChannel(channelName, btnElement) {
  currentChannel = channelName;
  const chips = document.querySelectorAll('#forum-channel-chips .channel-chip');
  chips.forEach(c => c.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  renderForumDiscussions();
}

function handleForumSearch(inputElement) {
  searchQuery = (inputElement.value || '').toLowerCase().trim();
  renderForumDiscussions();
}

function renderForumDiscussions() {
  const container = document.getElementById('forum-grid-container');
  if (!container) return;

  let filtered = forumState.filter(item => {
    const matchChannel = currentChannel === 'All' || item.channel === currentChannel;
    const matchQuery = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery) ||
      item.excerpt.toLowerCase().includes(searchQuery) ||
      item.authorName.toLowerCase().includes(searchQuery);
    return matchChannel && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">💬</div>
        <h3 style="margin-bottom: 0.5rem;">No Discussions Found</h3>
        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
          Be the first innovator to launch a thread or search for co-founders in this channel!
        </p>
        <button class="btn btn-primary" onclick="openNewDiscussionModal()">+ Start Discussion</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const tagClass = getTagBadgeClass(item.channel);
    const tagLabel = getTagLabel(item.channel);
    const hasRoles = item.rolesNeeded && item.rolesNeeded.length > 0;
    const userUpvoted = localStorage.getItem(`upvoted_${item.id}`) === 'true';

    return `
      <div class="glass-card forum-card reveal-on-scroll is-visible">
        <div class="forum-card-header">
          <div class="forum-author">
            <img src="${item.authorAvatar}" onerror="this.onerror=null; this.src='${item.fallbackAvatar}';" alt="${item.authorName}" class="author-avatar" />
            <div>
              <div class="author-name">${item.authorName}</div>
              <div class="author-meta">${item.authorRole} • ${item.timestamp}</div>
            </div>
          </div>
          <span class="forum-tag-badge ${tagClass}">${tagLabel}</span>
        </div>

        <h3 class="forum-title">${item.title}</h3>
        <p class="forum-excerpt">${item.excerpt}</p>

        ${hasRoles ? `
          <div class="needed-roles-box">
            <div class="needed-roles-title">🤝 Looking For Team Collaborators:</div>
            <div class="role-chips">
              ${item.rolesNeeded.map(r => `<span class="role-chip">⚡ ${r}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="forum-card-footer">
          <div style="display: flex; gap: 0.8rem; align-items: center;">
            <button class="upvote-btn ${userUpvoted ? 'upvoted' : ''}" onclick="toggleUpvote('${item.id}')">
              ▲ ${item.upvotes} Upvotes
            </button>
            <button class="comment-count-btn" onclick="openCommentsModal('${item.id}')">
              💬 ${item.comments.length} ${item.comments.length === 1 ? 'Reply' : 'Replies'}
            </button>
          </div>

          ${hasRoles ? `
            <button class="btn btn-secondary" style="padding: 0.35rem 0.9rem; font-size: 0.8rem;" onclick="openConnectModal('${item.id}')">
              Join Team
            </button>
          ` : `
            <button class="btn btn-secondary" style="padding: 0.35rem 0.9rem; font-size: 0.8rem;" onclick="openCommentsModal('${item.id}')">
              Discuss
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function getTagBadgeClass(channel) {
  switch (channel) {
    case 'TeamUp': return 'tag-team';
    case 'IdeaPitch': return 'tag-idea';
    case 'TechQA': return 'tag-tech';
    case 'Grants': return 'tag-grant';
    case 'Showcase': return 'tag-tech';
    default: return 'tag-team';
  }
}

function getTagLabel(channel) {
  switch (channel) {
    case 'TeamUp': return '🤝 Team Up';
    case 'IdeaPitch': return '💡 Idea Pitch';
    case 'TechQA': return '🛠️ Tech Q&A';
    case 'Grants': return '💰 Grants';
    case 'Showcase': return '🎉 Showcase';
    default: return channel;
  }
}

function toggleUpvote(id) {
  const item = forumState.find(x => x.id === id);
  if (!item) return;

  const key = `upvoted_${id}`;
  const isAlreadyUpvoted = localStorage.getItem(key) === 'true';

  if (isAlreadyUpvoted) {
    item.upvotes -= 1;
    localStorage.removeItem(key);
  } else {
    item.upvotes += 1;
    localStorage.setItem(key, 'true');
  }

  if (typeof sbUpvoteDiscussion === 'function') {
    sbUpvoteDiscussion(id, item.upvotes);
  }

  saveForumState();
  renderForumDiscussions();
}

/* Modal Handlers for Forum */

function openNewDiscussionModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  if (!modalOverlay || !modalContainer) return;

  modalContainer.innerHTML = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div style="margin-bottom: 1.5rem;">
      <span class="badge-tag">Community Forum</span>
      <h2 style="font-size: 1.8rem; margin-top: 0.5rem;" class="gradient-text">Start a New Discussion</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">Share your idea, request team collaborators, or post a technical query.</p>
    </div>

    <form onsubmit="handleCreateDiscussionSubmit(event)">
      <div class="form-group">
        <label class="form-label">Your Name & Department *</label>
        <input type="text" id="new-disc-name" class="form-input" placeholder="e.g. Rahul Sharma (S5 CSE)" required />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Channel Category *</label>
          <select id="new-disc-channel" class="form-select" required>
            <option value="TeamUp">🤝 Team Up / Co-Founder Search</option>
            <option value="IdeaPitch">💡 Idea Pitch & Feedback</option>
            <option value="TechQA">🛠️ Tech & Hardware Q&A</option>
            <option value="Grants">💰 Grants & Competitions</option>
            <option value="Showcase">🎉 Project Showcase</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Roles Needed (Optional)</label>
          <input type="text" id="new-disc-roles" class="form-input" placeholder="e.g. UI Designer, Flutter Dev" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Discussion Title *</label>
        <input type="text" id="new-disc-title" class="form-input" placeholder="Summarize your project or question..." required />
      </div>

      <div class="form-group">
        <label class="form-label">Detailed Overview *</label>
        <textarea id="new-disc-body" class="form-textarea" rows="3" placeholder="Provide background details, technology stack, goal..." required></textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Publish Discussion</button>
      </div>
    </form>
  `;

  modalOverlay.classList.add('active');
}

async function handleCreateDiscussionSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('new-disc-name').value;
  const channel = document.getElementById('new-disc-channel').value;
  const rolesRaw = document.getElementById('new-disc-roles').value;
  const title = document.getElementById('new-disc-title').value;
  const excerpt = document.getElementById('new-disc-body').value;

  const rolesNeeded = rolesRaw ? rolesRaw.split(',').map(r => r.trim()).filter(Boolean) : [];

  const newPost = {
    id: 'thread-' + Date.now(),
    authorName: name.split('(')[0].trim(),
    authorRole: name.includes('(') ? name.split('(')[1].replace(')', '').trim() : 'Innovator',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    channel: channel,
    title: title,
    excerpt: excerpt,
    rolesNeeded: rolesNeeded,
    timestamp: 'Just now',
    upvotes: 1,
    comments: []
  };

  if (typeof sbCreateDiscussion === 'function') {
    const sbPost = await sbCreateDiscussion(newPost);
    if (sbPost) {
      newPost.id = sbPost.id;
    }
  }

  forumState.unshift(newPost);
  saveForumState();
  closeModal();
  renderForumDiscussions();
  showToast('🚀 Discussion published successfully to IEDC Innovators Forum!');
}

/* Comments Modal */
function openCommentsModal(id) {
  const item = forumState.find(x => x.id === id);
  if (!item) return;

  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  if (!modalOverlay || !modalContainer) return;

  const commentsHtml = item.comments.length > 0
    ? item.comments.map(c => `
        <div class="comment-item">
          <div class="comment-header">
            <img src="${c.avatar}" alt="${c.author}" class="comment-avatar" />
            <span style="font-size: 0.85rem; font-weight: 700;">${c.author}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${c.time}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 2.2rem;">${c.text}</p>
        </div>
      `).join('')
    : `<p style="color: var(--text-muted); font-size: 0.85rem; font-style: italic; margin-bottom: 1rem;">No replies yet. Be the first to leave a comment!</p>`;

  modalContainer.innerHTML = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div style="margin-bottom: 1.2rem;">
      <span class="forum-tag-badge ${getTagBadgeClass(item.channel)}">${getTagLabel(item.channel)}</span>
      <h2 style="font-size: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.4rem;">${item.title}</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">By ${item.authorName} (${item.authorRole})</p>
    </div>

    <div style="max-height: 250px; overflow-y: auto; padding-right: 0.5rem; margin-bottom: 1.5rem;">
      <h4 style="font-size: 0.9rem; color: var(--accent-cyan); margin-bottom: 0.8rem;">Discussion Replies (${item.comments.length})</h4>
      ${commentsHtml}
    </div>

    <form onsubmit="handleAddCommentSubmit(event, '${item.id}')">
      <div style="display: flex; gap: 0.8rem;">
        <input type="text" id="new-comment-text" class="form-input" placeholder="Write a reply..." required />
        <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.2rem; white-space: nowrap;">Post Reply</button>
      </div>
    </form>
  `;

  modalOverlay.classList.add('active');
}

async function handleAddCommentSubmit(event, id) {
  event.preventDefault();
  const textInput = document.getElementById('new-comment-text');
  if (!textInput || !textInput.value.trim()) return;

  const item = forumState.find(x => x.id === id);
  if (!item) return;

  const newComment = {
    author: "You (BMCE Student)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    time: "Just now",
    text: textInput.value.trim()
  };

  if (typeof sbAddComment === 'function') {
    await sbAddComment(id, newComment);
  }

  item.comments.push(newComment);

  saveForumState();
  openCommentsModal(id); // Re-render comments modal
  renderForumDiscussions(); // Refresh grid view
  showToast('💬 Reply posted!');
}

/* Connect / Join Team Modal */
function openConnectModal(id) {
  const item = forumState.find(x => x.id === id);
  if (!item) return;

  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  if (!modalOverlay || !modalContainer) return;

  modalContainer.innerHTML = `
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div style="margin-bottom: 1.5rem;">
      <span class="badge-tag">Collaborator Application</span>
      <h2 style="font-size: 1.6rem; margin-top: 0.5rem;" class="gradient-text">Apply to Join ${item.authorName}'s Team</h2>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">Project: ${item.title}</p>
    </div>

    <form onsubmit="handleConnectSubmit(event, '${item.authorName.replace(/'/g, "\\'")}')">
      <div class="form-group">
        <label class="form-label">Your Name & Mobile Number *</label>
        <input type="text" class="form-input" placeholder="e.g. Anjali V. (+91 9876543210)" required />
      </div>

      <div class="form-group">
        <label class="form-label">Select Role You Can Contribute To *</label>
        <select class="form-select" required>
          ${item.rolesNeeded.map(r => `<option value="${r}">${r}</option>`).join('')}
          <option value="General Contributor">Other Tech / Support Contribution</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Brief Intro & Previous Experience *</label>
        <textarea class="form-textarea" rows="3" placeholder="Mention your skills, GitHub/portfolio link, or relevant course projects..." required></textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Send Application</button>
      </div>
    </form>
  `;

  modalOverlay.classList.add('active');
}

function handleConnectSubmit(event, authorName) {
  event.preventDefault();
  closeModal();
  showToast(`🤝 Application sent! ${authorName} will reach out via WhatsApp / Email.`);
}
