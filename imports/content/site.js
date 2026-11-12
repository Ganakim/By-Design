// every piece of copy on the site. templates read from here through helpers
// TODO phase 3: all of this is placeholder until Grey approves it line by line

export const studio = {
  name: 'By-Design',
  suffix: 'Labs',
  legalName: 'By-Design Labs LLC',
  place: 'Utah'
}

export const nav = [
  {label:'Work', href:'/#Make'},
  {label:'Mechaclasm', href:'/#Mechaclasm'},
  {label:'About', href:'/#About'},
  {label:'Contact', href:'/#Contact'}
]

export const pages = {
  home: {
    hero: {
      eyebrow: 'Software studio, Utah',
      title: 'Games, web apps and tools.',
      lead: 'A small lab that builds things on purpose: multiplayer games with their own servers, sites and apps for clients, and the tools in between.',
      primary: {label:'Get in touch', href:'/#Contact', glass:true},
      secondary: {label:'Current project', href:'/#Mechaclasm'}
    },
    make: {
      heading: 'What the lab makes',
      items: [
        {tag:'Games', title:'Multiplayer games', text:'Real-time games with their own backends, built in Unity.'},
        {tag:'Web', title:'Web apps', text:'Sites and apps for clients, from the first sketch to the server they run on.'},
        {tag:'Tools', title:'Bots and tools', text:'Discord bots and the small tools that make the rest possible.'}
      ]
    },
    mechaclasm: {
      tag: 'Current project',
      title: 'Mechaclasm',
      text: 'A multiplayer game with its own backend, in development.',
      status: 'In development',
      // TODO phase 3: ask Grey whether the site is ready for visitors before linking it
      link: {label:'Visit Mechaclasm', href:'https://mechaclasm.by-design.dev', glass:true}
    },
    about: {
      heading: 'About',
      // TODO phase 3: the name to show, and how much personal detail Grey wants
      text: 'By-Design Labs LLC is a one-person software company registered in Utah. A short paragraph on who is behind it goes here.'
    },
    contact: {
      heading: 'Get in touch',
      text: 'Email is the best way to reach the lab.',
      // TODO phase 3: the public contact email
      email: {label:'Email', href:'mailto:TODO', glass:true},
      // TODO phase 3: confirm GitHub, ask about Discord and anything else
      profiles: [{label:'GitHub', href:'https://github.com/Ganakim'}]
    }
  },
  notFound: {
    eyebrow: 'Error 404',
    heading: 'Nothing here.',
    body: 'That page doesn\'t exist. It may have moved, or the link may be wrong.',
    back: {label:'Back to the start', href:'/', glass:true}
  }
}
