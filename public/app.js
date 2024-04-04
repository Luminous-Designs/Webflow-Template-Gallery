const templateGrid = document.getElementById('template-grid');

function createTemplateCard(template) {
  const card = document.createElement('div');
  card.classList.add('template-card');
  card.dataset.tags = template.tags.join(',');

  const titleDiv = document.createElement('div');
  titleDiv.classList.add('title-div');

  const title = document.createElement('h3');
  title.textContent = template.title;
  titleDiv.appendChild(title);

  const screenshotImg = document.createElement('img');
  screenshotImg.src = template.screenshotPath;
  screenshotImg.alt = 'Template Screenshot';
  titleDiv.appendChild(screenshotImg);

  card.appendChild(titleDiv);

  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('actions-div');

  const previewButton = document.createElement('button');
  previewButton.textContent = 'Quick Preview';
  previewButton.addEventListener('click', () => openPreviewModal(template.livePreviewUrl, template.link));
  actionsDiv.appendChild(previewButton);

  const templateLink = document.createElement('a');
  templateLink.href = template.link;
  templateLink.target = '_blank';
  templateLink.textContent = 'Template URL';
  actionsDiv.appendChild(templateLink);

  card.appendChild(actionsDiv);

  return card;
}

function lazyLoadScreenshots() {
  const lazyScreenshots = document.querySelectorAll('.lazy-screenshot');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy-screenshot');
        observer.unobserve(img);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  lazyScreenshots.forEach(img => {
    observer.observe(img);
  });
}

function openPreviewModal(previewUrl, templateUrl) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add('buttons-container');

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => closePreviewModal(modal));
  buttonsContainer.appendChild(closeButton);

  const templateUrlButton = document.createElement('button');
  templateUrlButton.textContent = 'Go to Template URL';
  templateUrlButton.addEventListener('click', () => window.open(templateUrl, '_blank'));
  buttonsContainer.appendChild(templateUrlButton);

  modalContent.appendChild(buttonsContainer);

  const previewContainer = document.createElement('div');
  previewContainer.classList.add('preview-container');

  const previewIframe = document.createElement('iframe');
  previewIframe.src = `/proxy?url=${encodeURIComponent(previewUrl)}`;
  previewIframe.classList.add('preview-iframe');
  previewContainer.appendChild(previewIframe);

  modalContent.appendChild(previewContainer);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  setTimeout(() => {
    modal.style.opacity = '1';
    modalContent.style.transform = 'scale(1)';
  }, 0);
}


function closePreviewModal(modal) {
  const modalContent = modal.querySelector('.modal-content');
  modal.style.opacity = '0';
  modalContent.style.transform = 'scale(0.8)';

  setTimeout(() => {
    modal.remove();
  }, 300);
}

function lazyLoadIframes() {
  const lazyIframes = document.querySelectorAll('.lazy');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        iframe.src = iframe.dataset.src;
        iframe.classList.remove('lazy');
        observer.unobserve(iframe);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  lazyIframes.forEach(iframe => {
    observer.observe(iframe);
  });
}

function shuffleTemplates() {
  const cards = Array.from(templateGrid.children);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  cards.forEach(card => templateGrid.appendChild(card));
}

function initializeTagSearch(tags) {
  const tagSearch = document.getElementById('tag-search');
  new Awesomplete(tagSearch, {
    list: tags,
    autoFirst: true,
    filter: Awesomplete.FILTER_CONTAINS,
    minChars: 1,
    maxItems: 5
  });

  tagSearch.addEventListener('awesomplete-selectcomplete', (event) => {
    const selectedTag = event.text.trim();
    filterTemplatesByTag(selectedTag);
  });
}

function filterTemplatesByTag(selectedTag) {
  const lowerCaseSelectedTag = selectedTag.toLowerCase();
  const templateCards = document.querySelectorAll('.template-card');
  templateCards.forEach(card => {
    const tags = card.dataset.tags.split(',');
    if (tags.includes(lowerCaseSelectedTag)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

async function loadTemplates() {
  try {
    const response = await fetch('/api/templates');
    const templates = await response.json();
    
    const uniqueTags = new Set();
    templates.forEach(template => {
      template.tags = template.tags.map(tag => tag.toLowerCase());
      template.tags.forEach(tag => uniqueTags.add(tag));
      const card = createTemplateCard(template);
      templateGrid.appendChild(card);
    });
    
    initializeTagSearch(Array.from(uniqueTags));
    lazyLoadIframes();

    const shuffleBtn = document.getElementById('shuffle-btn');
    shuffleBtn.addEventListener('click', shuffleTemplates);
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

loadTemplates();