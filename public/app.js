const templateGrid = document.getElementById('template-grid');

function createTemplateCard(template) {
  const card = document.createElement('div');
  card.classList.add('template-card');

  const title = document.createElement('h3');
  title.textContent = template.title;
  card.appendChild(title);

  const previewIframe = document.createElement('iframe');
  previewIframe.src = `/proxy?url=${encodeURIComponent(template.livePreviewUrl)}`;
  previewIframe.classList.add('preview-iframe');
  card.appendChild(previewIframe);

  const templateLink = document.createElement('a');
  templateLink.href = template.link;
  templateLink.target = '_blank';
  templateLink.textContent = 'Template URL';
  card.appendChild(templateLink);

  return card;
}

async function loadTemplates() {
  try {
    const response = await fetch('/api/templates');
    const templates = await response.json();
    templates.forEach(template => {
      const card = createTemplateCard(template);
      templateGrid.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

loadTemplates();