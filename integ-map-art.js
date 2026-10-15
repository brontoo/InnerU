/* Original scientific illustrations for the integumentary mission map.
   Artwork can be inspected independently of mission progress. */
(function () {
  'use strict';
  if (window.__integMapArt) return;
  window.__integMapArt = true;

  const illustrations = [
    {
      file: '01-barrier', title: 'Build the barrier',
      alt: 'Skin cutaway with a thin epidermis, fibrous dermis, subcutaneous fat, a hair follicle, glands, blood vessels and nerves.',
      caption: 'Skin is an organ made from several tissue types. Its epithelial covering works with connective tissue, nerves, blood vessels and tiny smooth muscles.'
    },
    {
      file: '02-renewal', title: 'Layers and renewal',
      alt: 'Skin layers beside an enlarged epidermis showing rounded basal cells becoming flattened surface cells that shed.',
      caption: 'New keratinocytes form in the basal epidermis, differentiate as they move outward, and eventually shed from the surface. The dermis supports the avascular epidermis; subcutaneous tissue lies below.'
    },
    {
      file: '03-appendages', title: 'Hair, nails and glands',
      alt: 'Hair follicle, sebaceous gland, arrector pili and coiled sweat gland alongside a longitudinal fingernail cutaway.',
      caption: 'Sebaceous glands release sebum into hair follicles. Eccrine sweat ducts open separately at the surface. Hair grows from its follicle; the nail matrix produces the nail plate.'
    },
    {
      file: '04-temperature', title: 'Balance the temperature',
      alt: 'Eccrine sweat gland and its surface duct surrounded by a dermal blood supply, with sweat droplets above the skin.',
      caption: 'Evaporating sweat removes heat. Widening dermal blood vessels increases heat transfer toward the surface; narrowing them reduces heat loss. Subcutaneous fat helps insulate the body.'
    },
    {
      file: '05-sensation', title: 'Protect and sense',
      alt: 'Golden sensory nerves in a skin cutaway with a hair-root plexus, free endings and an enlarged lamellated pressure receptor.',
      caption: 'Hair-root nerve plexuses detect hair movement. Free nerve endings contribute to temperature and pain sensation. Deep Pacinian corpuscles respond especially to vibration and changes in pressure.'
    },
    {
      file: '06-repair', title: 'Repair the shield',
      alt: 'Three skin cutaways showing a protective clot, repair beneath a scab, and a restored continuous surface.',
      caption: 'A clot limits bleeding. Inflammation clears damaged tissue and helps defend the wound. New epithelium closes the surface while connective tissue repairs and remodels below. Healing stages overlap.'
    },
    {
      file: '07-living-shield', title: 'Restore the Living Shield',
      alt: 'Healthy integrated skin anatomy with protective surface layers, hair, glands, sensory nerves, vessels and supporting fat.',
      caption: 'Bring the discoveries together: an intact barrier, renewing cells, working glands, temperature regulation, sensory feedback and tissue repair all help maintain a healthy living shield.'
    }
  ];
  const escapeHTML = text => text.replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const source = item => `assets/integ-missions/${item.file}.webp`;

  window.inneruIntegMapArt = function (number) {
    const item = illustrations[number - 1];
    if (!item) return '';
    return `<img src="${source(item)}" alt="${escapeHTML(item.alt)}" width="1536" height="1024" loading="lazy" decoding="async"><button type="button" class="integ-art-expand" data-integ-illustration="${number}" aria-label="Enlarge illustration: ${escapeHTML(item.title)}"><span aria-hidden="true">⤢</span> Expand</button>`;
  };

  function addArtwork(card, number) {
    if (!card || card.querySelector('.integ-card-art')) return;
    const artwork = window.inneruIntegMapArt(number);
    if (!artwork) return;
    const band = document.createElement('div');
    band.className = 'integ-card-art';
    band.innerHTML = artwork;
    card.prepend(band);
  }

  function addViewer(world) {
    if (world.querySelector('.integ-art-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'integ-art-dialog';
    dialog.setAttribute('aria-labelledby', 'integ-art-title');
    dialog.innerHTML = '<button type="button" class="integ-art-close" autofocus>Close illustration <span aria-hidden="true">×</span></button><figure><img width="1536" height="1024" alt=""><figcaption><h2 id="integ-art-title"></h2><p></p><small>Original scientific illustration · structures enlarged for learning; not to scale</small></figcaption></figure>';
    world.append(dialog);
    world.addEventListener('click', event => {
      const button = event.target.closest('[data-integ-illustration]');
      if (!button) return;
      const item = illustrations[Number(button.dataset.integIllustration) - 1];
      if (!item) return;
      const image = dialog.querySelector('img');
      image.src = source(item);
      image.alt = item.alt;
      dialog.querySelector('h2').textContent = item.title;
      dialog.querySelector('figcaption p').textContent = item.caption;
      dialog.showModal();
    });
    dialog.querySelector('.integ-art-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }

  function inject() {
    if (location.hash.split('?')[0] !== '#integumentary') return;
    const world = document.querySelector('.integ-world');
    if (!world) return;
    world.classList.add('integ-map');
    world.querySelectorAll('.resp-grid .resp-card').forEach((card, index) => addArtwork(card, index + 1));
    const finale = world.querySelector('.resp-finale');
    if (finale) {
      addArtwork(finale, 7);
      finale.classList.add('has-art');
    }
    addViewer(world);
  }

  const run = () => setTimeout(inject, 80);
  window.addEventListener('hashchange', run);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
