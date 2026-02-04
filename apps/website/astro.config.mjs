import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://getvibekit.ai',
  integrations: [
    starlight({
      title: 'VibeKit',
      description: 'AI-powered Algorand smart contract development',
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/gabrielkuettel/vibekit' },
        { icon: 'x.com', label: 'X', href: 'https://x.com/getvibekit' },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'How It Works', slug: 'getting-started/how-it-works' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Agent Skills', slug: 'features/agent-skills' },
            { label: 'MCP Servers', slug: 'features/mcp-servers' },
            { label: 'Account Providers', slug: 'features/account-providers' },
          ],
        },
        {
          label: 'CLI Reference',
          items: [
            { label: 'vibekit init', slug: 'cli-reference/init' },
            { label: 'vibekit status', slug: 'cli-reference/status' },
            { label: 'vibekit vault', slug: 'cli-reference/vault' },
            { label: 'vibekit account', slug: 'cli-reference/account' },
            { label: 'vibekit dispenser', slug: 'cli-reference/dispenser' },
          ],
        },
        // { label: 'Troubleshooting', slug: 'troubleshooting' },
      ],
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://getvibekit.ai/og-image.png',
          },
        },
        {
          tag: 'script',
          content: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-5XBZ7HB');`,
        },
      ],
    }),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
})
