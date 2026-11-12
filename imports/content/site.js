// every piece of copy on the site. templates read from here through helpers

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
        {tag:'Fabrication', title:'3D design and printing', text:'Parts modelled from a sketch or a brief, delivered as print-ready files or printed in-house.'}
      ]
    },
    mechaclasm: {
      tag: 'Current project',
      title: 'Mechaclasm',
      text: 'A bot-building vehicle combat game. Design a machine part by part in the garage, then take it into online matches where the server rules on every hit.',
      status: 'Playable · in development',
      link: {label:'Visit Mechaclasm', href:'https://mechaclasm.by-design.dev', glass:true}
    },
    about: {
      heading: 'About',
      text: 'By-Design Labs LLC is the independent practice of Spencer Cornwall, based in Utah. The work spans software and hardware: games and the servers behind them, web platforms, custom computers, and 3D design and printing. Each project is taken from the first idea to the finished thing by the same hands.'
    },
    contact: {
      heading: 'Get in touch',
      text: 'For commissions, collaborations or questions, write to the lab directly.',
      email: {label:'contact@by-design.dev', href:'mailto:contact@by-design.dev', glass:true},
      // email only for now. a profile is one {label, href} away
      profiles: []
    }
  },
  notFound: {
    eyebrow: 'Error 404',
    heading: 'Nothing here.',
    body: 'That page doesn\'t exist. It may have moved, or the link may be wrong.',
    back: {label:'Back to the start', href:'/', glass:true}
  }
}
