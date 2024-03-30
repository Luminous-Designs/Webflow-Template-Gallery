const templateGrid = document.getElementById('template-grid');

function createTemplateCard(template) {
  const card = document.createElement('div');
  card.classList.add('template-card');

  const title = document.createElement('h3');
  title.textContent = template.title;
  card.appendChild(title);

  const previewLink = document.createElement('a');
  previewLink.href = template.livePreviewUrl;
  previewLink.target = '_blank';
  previewLink.textContent = 'Live Preview';
  card.appendChild(previewLink);

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