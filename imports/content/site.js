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
  {label:'About', href:'/#About'},
  {label:'Contact', href:'/#Contact'}
]

export const pages = {
  home: {
    hero: {
      eyebrow: 'Independent engineering lab, Utah',
      title: 'Software, systems and fabrication.',
      lead: 'A small lab that builds things deliberately: multiplayer games and the servers behind them, web platforms for clients, custom hardware, and printed parts.',
      primary: {label:'Get in touch', href:'/#Contact', glass:true},
      secondary: {label:'Current project', href:'/#Mechaclasm'}
    },
    make: {
      heading: 'Areas of work',
      items: [
        {tag:'Interactive', title:'Real-time games', text:'Multiplayer games engineered end to end, from the Unity client to the servers that run it.'},
        {tag:'Web', title:'Web platforms', text:'Sites and applications for clients, carried from first draft through to the infrastructure they run on.'},
        {tag:'Tooling', title:'Automation', text:'Discord bots, internal utilities, and the supporting tools the rest of the work depends on.'},
        {tag:'Hardware', title:'Custom systems', text:'Computers specified around the work they have to do, then assembled and tuned by hand.'},
        {tag:'Fabrication', title:'Additive manufacturing', text:'Prototypes, functional parts and one-off pieces, 3D printed in-house.'}
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
