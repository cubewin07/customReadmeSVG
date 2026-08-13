/**
 * Inline Vector SVG Icons for Custom README Cards
 * Returns clean SVG path strings for rendering inside card SVGs.
 */

export const icons = {
  repo: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-10h-8a1 1 0 00-1 1v10.5a.75.75 0 01-1.5 0V2.5zM1.75 13.5a.25.25 0 00-.25.25v.5c0 .414.336.75.75.75h9.5a.75.75 0 00.75-.75v-.5a.25.25 0 00-.25-.25h-10.5z"></path>
    </svg>`,

  star: (color = '#e3b341') => `
    <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
    </svg>`,

  fork: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5A2.25 2.25 0 0012 6.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-3.5a.75.75 0 01-.75-.75v-.878zM10.25 4a.75.75 0 100-1.5.75.75 0 000 1.5zm-2 9a.75.75 0 100-1.5.75.75 0 000 1.5z"></path>
    </svg>`,

  followers: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M10.5 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.5 0a4 4 0 10-8 0 4 4 0 008 0zm-10.25 9a.75.75 0 01.75-.75h11a.75.75 0 010 1.5h-11a.75.75 0 01-.75-.75zM8 9.5a5.48 5.48 0 00-4.5 2.378.75.75 0 01-1.233-.856A6.98 6.98 0 018 8a6.98 6.98 0 015.733 3.022.75.75 0 11-1.233.856A5.48 5.48 0 008 9.5z"></path>
    </svg>`,

  commits: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M10.5 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM8 0a.75.75 0 01.75.75v1.815a5.503 5.503 0 013.935 3.935h1.815a.75.75 0 010 1.5h-1.815a5.503 5.503 0 01-3.935 3.935v1.815a.75.75 0 01-1.5 0v-1.815a5.503 5.503 0 01-3.935-3.935H1.515a.75.75 0 010-1.5h1.815A5.503 5.503 0 017.25 2.565V.75A.75.75 0 018 0z"></path>
    </svg>`,

  location: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="13" height="13" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M11.536 11.01a5 5 0 10-7.072 0l3.182 3.182a.5.5 0 00.708 0l3.182-3.182zM8 9a2 2 0 100-4 2 2 0 000 4z"></path>
    </svg>`,

  company: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="13" height="13" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v1.25h2.25v-2.5a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v2.5h.25a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H1.75a.25.25 0 00-.25.25v9.5zM0 4.75C0 3.784.784 3 1.75 3h12.5c.966 0 1.75.784 1.75 1.75v9.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25v-9.5zM4 6.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 014 6.75zm5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 019 6.75zm-5 3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 014 9.75zm5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 019 9.75z"></path>
    </svg>`,

  link: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="13" height="13" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path>
    </svg>`,

  calendar: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="13" height="13" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25C14.216 2 15 2.784 15 3.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h-2a.25.25 0 00-.25.25V5h13V3.75a.25.25 0 00-.25-.25h-2V4.5a.75.75 0 01-1.5 0V3.5h-5V4.5a.75.75 0 01-1.5 0V3.5zM2.5 6.5v7.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V6.5h-11z"></path>
    </svg>`,

  code: (color = 'currentColor') => `
    <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="${color}" style="display:inline-block;vertical-align:text-top;">
      <path fill-rule="evenodd" d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L13.94 8l-3.72-3.72a.75.75 0 010-1.06z"></path>
    </svg>`,
};
