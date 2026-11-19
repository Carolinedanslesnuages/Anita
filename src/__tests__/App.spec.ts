import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { violationsAccessibilite } from '@/__tests__/accessibilite'
import App from '@/App.vue'

describe('Anita : barre de navigation et pied de page', () => {
  async function monterApplication() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<h1>Anita — Votre territoire, dessiné par l’eau</h1>' } }],
    })
    await router.push('/')
    return mount(App, { global: { plugins: [createPinia(), router] }, attachTo: document.body })
  }

  it('affiche le nom Anita, sa devise, une navigation et un pied de page', async () => {
    const wrapper = await monterApplication()
    expect(wrapper.find('header').text()).toContain('Anita')
    expect(wrapper.find('header').text()).toContain('Votre territoire, dessiné par l’eau')
    expect(wrapper.find('nav[aria-label="Navigation principale"]').exists()).toBe(true)
    expect(wrapper.find('footer').text()).toContain('Anita')
    expect(wrapper.find('a[href="#contenu"]').text()).toBe('Aller au contenu')
    wrapper.unmount()
  })

  it('n’a aucune violation d’accessibilité automatique', async () => {
    const wrapper = await monterApplication()
    expect(await violationsAccessibilite(document.body)).toEqual([])
    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
