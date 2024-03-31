const templateGrid = document.getElementById('template-grid');

function createTemplateCard(template) {
  const card = document.createElement('div');
  card.classList.add('template-card');

  const title = document.createElement('h3');
  title.textContent = template.title;
  card.appendChild(title);

  const previewContainer = document.createElement('div');
  previewContainer.classList.add('preview-container');
  card.appendChild(previewContainer);

  const previewIframe = document.createElement('iframe');
  previewIframe.dataset.src = `/proxy?url=${encodeURIComponent(template.livePreviewUrl)}`;
  previewIframe.classList.add('preview-iframe');
  previewIframe.classList.add('lazy');
  previewContainer.appendChild(previewIframe);

  const templateLink = document.createElement('a');
  templateLink.href = template.link;
  templateLink.target = '_blank';
  templateLink.textContent = 'Template URL';
  card.appendChild(templateLink);

  return card;
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

async function loadTemplates() {
  try {
    const response = await fetch('/api/templates');
    const templates = await response.json();
    templates.forEach(template => {
      const card = createTemplateCard(template);
      templateGrid.appendChild(card);
    });
    lazyLoadIframes();
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

loadTemplates();