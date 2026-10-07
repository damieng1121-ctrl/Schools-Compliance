/**
 * DfE "Meeting digital and technology standards in schools and colleges"
 * catalogue data — pure data module, no Prisma/bcrypt imports, so it can be
 * read by both prisma/seed.ts (DB seeding) and scripts that generate SQL
 * without needing a live database connection.
 *
 * `sourceText` on every item is the DfE's own wording, taken word-for-word
 * from the individual GOV.UK guidance page named in `govLink` (sub-headings
 * "Why/Importance this standard is important", "How to meet the standard",
 * "Technical requirements to meet the standard", "When to meet the
 * standard" — kept in that order, separated by blank lines). It omits each
 * page's repeated "Who needs to be involved" role lists and "Related
 * standards" cross-links, which are navigational rather than part of the
 * requirement itself; nothing else is paraphrased or summarised.
 *
 * `description` is a separate, plain-English explanation written for a
 * Headteacher, IT Lead or School Business Manager — not DfE wording. The UI
 * must keep these two visibly distinct, never blended.
 *
 * Sourced directly from GOV.UK PDF exports supplied by the account owner
 * (update timestamp on the pages: 16 September 2026), not from training
 * data or web search. Re-confirm against the live pages before relying on
 * this for an official return, since DfE updates the standards periodically:
 * https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges
 */
const GOV_BASE = "https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges";

/** GOV.UK's in-page anchor slug for a heading: lowercase, punctuation stripped, spaces to hyphens. */
function anchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[():,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function link(pageSlug: string, heading: string): string {
  return `${GOV_BASE}/${pageSlug}#${anchor(heading)}`;
}

function src(parts: { why?: string; how?: string; technical?: string; when?: string }): string {
  const sections: string[] = [];
  if (parts.why) sections.push(`Why this standard is important\n\n${parts.why}`);
  if (parts.how) sections.push(`How to meet the standard\n\n${parts.how}`);
  if (parts.technical) sections.push(`Technical requirements to meet the standard\n\n${parts.technical}`);
  if (parts.when) sections.push(`When to meet the standard\n\n${parts.when}`);
  return sections.join("\n\n---\n\n");
}

type Rating = "RED" | "AMBER" | "GREEN";

/**
 * Optional traffic-light technical criterion for an item whose DfE
 * `sourceText` itself describes a tiered minimum (a generation, a speed) —
 * levels and ratings are read straight off that item's own `technical`
 * wording above, never invented.
 */
interface Criterion {
  id: string;
  label: string;
  levels: { value: string; label: string; rating: Rating }[];
}

interface ItemData {
  code: string;
  title: string;
  description: string;
  sourceText: string;
  guidance?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  govLink: string;
  criteria?: Criterion[];
}

interface StandardData {
  code: string;
  title: string;
  description: string;
  officialUrl: string;
  items: ItemData[];
}

export const STANDARDS: StandardData[] = [
  // -------------------------------------------------------------------
  // 1. Broadband internet — core standard
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/broadband-internet-core-standard
  // -------------------------------------------------------------------
  {
    code: "broadband",
    title: "Broadband internet",
    description:
      "Your internet connection needs to be fast enough and reliable enough that every classroom can use online learning tools at once without it grinding to a halt — and if the line goes down, the school shouldn't grind to a halt with it.",
    officialUrl: `${GOV_BASE}/broadband-internet-core-standard`,
    items: [
      {
        code: "full-fibre-connection",
        title: "Schools and colleges should use a full fibre connection for their broadband service",
        description:
          "In plain English: get the fastest connection you can afford, and make sure it's \"full fibre\" (sometimes called a leased line or FTTP) rather than an old copper line — copper doesn't meet this standard at all. Primary schools need at least 100Mbps download / 30Mbps upload; secondary schools, all-through schools and colleges need enough capacity for 1Gbps both ways.",
        sourceText: src({
          why: "Full fibre services provide the capacity and speed needed for effective use of online learning tools.\n\nGetting the fastest speed you can afford has a wide range of benefits including:\n\n- enabling teachers to have the confidence to make full use of online resources as integral parts of teaching and learning\n- saving money by using cloud-based solutions instead of on-site technical infrastructure, products or services – for example, VoIP telephony\n\nFull fibre services provide flexibility to future proof schools and colleges as demand for internet services increases.",
          how: "You should ask your supplier or IT support to investigate the availability of full fibre broadband services and speeds.\n\nPrimary schools should have a minimum of 100Mbps download speed and a minimum of 30Mbps upload speed.\n\nSecondary schools, all-through schools and further education colleges should have a connection with the capacity to deliver 1Gbps download and upload speed.",
          technical:
            "Broadband should be provided using a full fibre connection.\n\nFull fibre connections are sometimes described as:\n\n- a leased line\n- fibre to the premises (FTTP)\n\nNote: copper connections do not meet this standard.\n\nDependencies to the standard: the speed of your internet services may vary depending on your internal network cabling and switches, and your internal network equipment such as routers and wireless access points — see the standards on wireless networks, network cabling and network switches.",
          when: "You should be looking to implement this standard as soon as you can. This is usually at the end of any existing contract term or as soon as full fibre is available.\n\nEnsure that any new contracts or contract extensions using other non-full fibre connection types provide the opportunity to change to fibre services as soon as possible when they become available.",
        }),
        guidance: "Primary: min 100Mbps down / 30Mbps up. Secondary/college: capacity for 1Gbps both ways.",
        priority: "HIGH" as const,
        govLink: link("broadband-internet-core-standard", "Schools and colleges should use a full fibre connection for their broadband service"),
      },
      {
        code: "backup-broadband-connection",
        title: "Schools and colleges should have a backup broadband connection to ensure resilience and maintain continuity of service",
        description:
          "In plain English: don't rely on a single internet line. If it fails, you need a second connection (of a different type, e.g. a leased line plus a mobile/satellite backup) that switches over automatically, plus backup power for the core network kit, so the school doesn't lose the internet the moment one thing breaks.",
        sourceText: src({
          why: "With increasing reliance on internet-based services, broadband internet is an essential service. You should ensure that appropriate measures are in place to mitigate against a single point of failure.",
          how: "You should investigate which backup internet services are available and implement appropriate systems.\n\nYour broadband provider will be able to advise on possible solutions and costs.",
          technical:
            "This standard requires a combination of the following:\n\n- multiple broadband connection services of different service types – for example, a leased line combined with FTTP or FTTP combined with low Earth orbit satellite\n- multiple routers and appropriate associated router configuration to provide automatic failover to backup services as and when required\n- redundant power options on core active network equipment",
          when: "Resilient services should be implemented alongside, or as soon as possible after a new connection is installed.",
        }),
        guidance: "Needs 2 connections of different types + automatic failover + backup power on core kit.",
        priority: "HIGH" as const,
        govLink: link("broadband-internet-core-standard", "Schools and colleges should have a backup broadband connection to ensure resilience and maintain continuity of service"),
      },
      {
        code: "broadband-security-safeguarding",
        title: "Schools and colleges should have appropriate IT security and safeguarding systems in place, under both child and data protection legislation",
        description:
          "In plain English: your broadband needs to come with a content filtering system that meets the Keeping Children Safe in Education rules, plus a firewall — whether that's a box on-site or a service run by your broadband provider.",
        sourceText: src({
          why: "It's essential that children are safeguarded from potentially harmful and inappropriate online material. An effective whole school and college approach to online safety empowers a school or college to protect and educate students, and staff in their use of technology. It establishes ways to identify, intervene in, and escalate any concerns where appropriate.",
          how: "You should talk to your supplier or IT support to ensure that you have a content filtering system in place which meets the requirements outlined in the online safety section of keeping children safe in education, paragraphs 123-135.\n\nYou should also ensure that you have a firewall as part of your internet and network system. This could be an on-premises device directly protecting your network and directly managed by the school or college. It also might be an 'edge' service provided and managed by your supplier or IT support.",
          when: "You should already be meeting this standard as a part of the ongoing safeguarding requirements as set out in the statutory safeguarding guidance on keeping children safe in education.",
        }),
        priority: "HIGH" as const,
        govLink: link("broadband-internet-core-standard", "Schools and colleges should have appropriate IT security and safeguarding systems in place, under both child and data protection legislation"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 2. Wireless network — core standard
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/wireless-network-core-standard
  // -------------------------------------------------------------------
  {
    code: "wireless-network",
    title: "Wireless network",
    description:
      "Wi-Fi that actually reaches every classroom, copes with a full class of devices logging on at once, can be managed centrally rather than access-point-by-access-point, and keeps unauthorised devices off the network.",
    officialUrl: `${GOV_BASE}/wireless-network-core-standard`,
    items: [
      {
        code: "latest-wireless-standard",
        title: "Use the latest wireless network standards",
        description:
          "In plain English: when you next upgrade, the new Wi-Fi kit should use Wi-Fi 7 as a minimum, not whatever was current when the old kit was bought.",
        sourceText: src({
          why: "Your school or college will have a high number of users accessing the network at the same time. A high-performance solution will make sure that the speed and management of data transferred around the wireless network is resilient, efficient and secure.",
          how: "Work with your IT support to ensure that your wireless network allows you to achieve the outcomes and device usage you need across the site. They should support concurrent logon and use of all devices.\n\nIf you need an upgrade, you should ask your supplier or IT support to provide a wireless solution that uses, at a minimum, the Wi-Fi 7 standard.",
          technical:
            "When you need an upgrade, the wireless network should use the latest standard approved by the Wi-Fi Alliance, Wi-Fi 7 (802.11be).\n\nYou should also review the network interface speeds of the access points when considering the solution – these will typically be 1Gbps, 2.5Gbps and 5Gbps or 10Gbps.\n\nThe wireless network should be configured to support network segregation and QoS.\n\nDependencies: the speed of your wireless connection may be affected by your internal network cabling and switches.",
          when: "You should meet the standard when you need to upgrade an underperforming or unsupported solution.",
        }),
        guidance: "Minimum Wi-Fi 7 (802.11be) on next upgrade.",
        priority: "MEDIUM" as const,
        govLink: link("wireless-network-core-standard", "Use the latest wireless network standards"),
        criteria: [
          {
            id: "wireless-standard-in-use",
            label: "Wireless standard currently in use",
            levels: [
              { value: "legacy", label: "802.11 b/g/n (legacy)", rating: "RED" },
              { value: "wifi5", label: "Wi-Fi 5 (802.11ac)", rating: "AMBER" },
              { value: "wifi6", label: "Wi-Fi 6 / 6E (802.11ax)", rating: "AMBER" },
              { value: "wifi7", label: "Wi-Fi 7 (802.11be) — DfE minimum", rating: "GREEN" },
            ],
          },
        ],
      },
      {
        code: "wireless-signal-coverage",
        title: "Have a fully functional signal from your wireless network throughout the school or college buildings and externally where required",
        description:
          "In plain English: every classroom should have a working signal — up to one access point per room as a rule of thumb, with stronger units in halls and other high-capacity spaces. Your provider should have actually surveyed the building (\"heat mapping\"), not guessed.",
        sourceText: src({
          why: "Like with mobile phones, a good wireless connection relies on signal strength. It's important to make sure there is strong signal coverage in all areas of your school or college where mobile devices are to be used.",
          how: "You should have wireless access points installed across the site. This could be up to one per classroom, with higher-specification units in high-capacity areas such as halls.",
          technical:
            "Ensure that the number of access points provides coverage in each space that is in line with the planned occupation level. This is to support simultaneous use without reducing the performance.\n\nYou should ensure that your wireless provider designs a solution that fully meets your needs. This should include using wireless heat mapping as part of initial planning and ensuring that impact from building management systems and other networks is minimised.\n\nDependencies: the speed of your wireless connection may be affected by your internal network cabling and switches.",
          when: "You should meet the standard when you need to upgrade an underperforming or unsupported solution.",
        }),
        guidance: "Up to one access point per classroom; heat-mapped by your provider.",
        priority: "HIGH" as const,
        govLink: link("wireless-network-core-standard", "Have a fully functional signal from your wireless network throughout the school or college buildings and externally where required"),
      },
      {
        code: "wireless-central-management",
        title: "Have a solution that can centrally manage the wireless network",
        description:
          "In plain English: your IT support (internal or external) should be able to see and configure every access point from one screen, get alerted the moment one fails, and have security updates roll out automatically.",
        sourceText: src({
          why: "A wireless network will be made up of many wireless access points. A central management solution will allow your support team to monitor and configure your network and identify and resolve issues.",
          how: "Your wireless network provider or IT support should provide a central management tool that can be used to configure the wireless access points, monitor performance and provide alerts in the event of a failure.\n\nIt should also have the functionality to deliver software security updates automatically as soon as they are available. Manual checks should also be undertaken.",
          technical:
            "You should ask your supplier to make sure that the wireless solution will:\n\n- provide active signal management and load balancing of user or device connectivity\n- have tools that can be used to configure the wireless access points, monitor performance and provide alerts in the event of a failure\n- include a manufacturer warranty and support arrangements including licences, software enhancements, and security and firmware updates\n- include a system administrator training package, that is manufacturer approved and that covers all security elements for the solution\n- be scalable and can accommodate future higher bandwidth requirements\n- be capable of providing a configuration file that allows the solution to be reset to the original configuration for the school",
          when: "You should meet the standard when you need to upgrade an underperforming or unsupported solution.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("wireless-network-core-standard", "Have a solution that can centrally manage the wireless network"),
      },
      {
        code: "wireless-security-features",
        title: "Install security features to stop unauthorised access",
        description:
          "In plain English: nobody should be able to join your Wi-Fi without proper authentication. In practice this means separate staff/student/guest networks (VLANs), WPA3 encryption, and extra protection like MFA for IT admin accounts — because an open wireless network can let an outsider straight into school data.",
        sourceText: src({
          why: "Your school or college IT networks should prevent access by unauthorised users while providing access to regular and guest users.\n\nA wireless network without adequate security may allow unauthorised users access to secure information stored by the school or college. This could lead to:\n\n- theft or misuse of sensitive school or student data\n- loss of access to critical school systems\n- significant disruption and cost",
          how: "Ask your wireless network provider, supplier or IT support for a proposal that will support the latest Wi-Fi Alliance specification mentioned in technical requirements to meet that standard.\n\nThe solution should also ensure that users must not be able to access the network without appropriate authorisation and authentication methods. Any administrative accounts that have access to make configuration changes must be secure and fully documented.",
          technical:
            "The network solution should ensure that authorised mobile user devices or guest users are securely authenticated individually onto the network. The network traffic should be protected from external and unauthorised internal interception while not impacting on the network's performance.\n\nTo achieve this, you may need:\n\n- virtual local area networks (VLANs)\n- access control lists (ACLs)\n- secure segregated guest access\n- the latest authentication protocols (WPA3)\n- wireless intrusion protection (WIPs)\n- certificate-based authentication\n- multi-factor authentication (MFA) for privileged users and technical support staff\n\nDependencies: the security of your wireless connection may be affected by other cyber security factors — refer to the cyber security standards.",
          when: "You should meet the standard when you need to upgrade an underperforming or unsupported solution, or following a scheduled maintenance or configuration review.",
        }),
        priority: "HIGH" as const,
        govLink: link("wireless-network-core-standard", "Install security features to stop unauthorised access"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 3. Network switching — core standard
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/network-switching-core-standard
  // -------------------------------------------------------------------
  {
    code: "network-switching",
    title: "Network switching",
    description:
      "The switches that everything in the building plugs into — they need to be fast enough, centrally manageable, properly secured, and not go dark the moment the power blips.",
    officialUrl: `${GOV_BASE}/network-switching-core-standard`,
    items: [
      {
        code: "switches-fast-reliable-secure",
        title: "The network switches should provide fast, reliable and secure connections to all users both wired and wireless",
        description:
          "In plain English: every desktop connection should run at least 1Gbps, with faster multi-gigabit ports for things that need more (servers, Wi-Fi access points). Anything that powers other devices over the network cable (Wi-Fi points, CCTV, phones) must comply with the manufacturer's power spec.",
        sourceText: src({
          why: "You will have a high number of users accessing the network at the same time. A high-performance solution will make sure that the speed and management of data transferred around the network is resilient, efficient and secure.",
          how: "You should ask your supplier or IT support to make sure that switches provide a minimum of 1Gbps connectivity to the user device deployed to the desktop.\n\nYou should also make sure that higher-speed (multi-gigabit) ports support devices and infrastructure equipment that needs high bandwidth, such as servers, media devices and wireless access points.\n\nSwitches that provide power to devices such as wireless access points, CCTV, access control and telephones must comply with power requirements outlined by the device manufacturer.",
          technical:
            "Where switches are stacked, they should support 40Gbps interconnects between switches in a stack, dedicated stacking ports should be used to enable high-speed communication between each switch in the stack.\n\nConnections linking switches or switch stacks in hub rooms must connect back to the core server room using a minimum of 2x10Gbps with links taking different routes where possible.\n\nSwitches should:\n\n- have a minimum of 512MB of core memory\n- support a minimum of 16000 concurrent MAC addresses\n- support spanning tree protocols such as MST or RST\n- use non-blocking switch fabric\n- if they have Power over Ethernet (PoE), adhere to IEEE 802.3af.at or IEEE 802.3af.bt as required by the connecting device, and have LLDP-Med enabled\n- be Energy-Efficient Ethernet compliant to a minimum of 802.3az standard or equivalent\n\nDependencies: the performance of your network switches may be affected by the specification and quality of your network cabling.",
          when: "You should meet the standard when you need to replace your current solution that is underperforming or unsupported.",
        }),
        guidance: "Min 1Gbps to desktop; multi-gig for servers/APs; 40Gbps stacking; 2×10Gbps hub-to-core.",
        priority: "HIGH" as const,
        govLink: link("network-switching-core-standard", "The network switches should provide fast, reliable and secure connections to all users both wired and wireless"),
        criteria: [
          {
            id: "desktop-port-speed",
            label: "Desktop port speed",
            levels: [
              { value: "below1g", label: "100Mbps or below 1Gbps", rating: "RED" },
              { value: "1g", label: "1Gbps or more — DfE minimum", rating: "GREEN" },
            ],
          },
          {
            id: "stack-interconnect-speed",
            label: "Stack interconnect (where switches are stacked)",
            levels: [
              { value: "not-stacked", label: "Not stacked", rating: "AMBER" },
              { value: "below40g", label: "Stacked, interconnect below 40Gbps", rating: "RED" },
              { value: "40g-dac", label: "40Gbps dedicated stacking ports (e.g. DAC)", rating: "GREEN" },
            ],
          },
          {
            id: "hub-to-core-uplink",
            label: "Hub room to core server room uplink",
            levels: [
              { value: "below2x10g", label: "Below 2×10Gbps", rating: "RED" },
              { value: "2x10g", label: "2×10Gbps or more, diverse routes — DfE minimum", rating: "GREEN" },
            ],
          },
        ],
      },
      {
        code: "switches-central-management",
        title: "Have a platform that can centrally manage the network switching infrastructure",
        description:
          "In plain English: your supplier or IT support needs one tool to configure and monitor every switch and get alerted when something fails, plus a minimum 5-year manufacturer warranty, with training for whoever administers it on site.",
        sourceText: src({
          why: "A computer network will have many users accessing and transferring data. A central management console will allow the control and monitoring of the network efficiently and securely to ensure effective performance.",
          how: "Your supplier or IT support should provide a central management tool that can be used to configure the switching (core and edge), monitor performance and provide alerts in the event of a failure.",
          technical:
            "Switches should include a manufacturer warranty and support arrangement (telephone, email and web) including licences, software enhancements and firmware updates, providing 5 years of cover as a minimum.\n\nEquipment that is no longer able to receive firmware and security updates should be replaced.\n\nSwitches should also include a system administrator training package on your school or college site that is:\n\n- approved by your manufacturer\n- appropriate to the scale of the solution\n- covering all security elements for the solution",
          when: "You should meet the standard when you need to replace your current solution that is underperforming or unsupported.",
        }),
        guidance: "Minimum 5-year manufacturer warranty/support on switches.",
        priority: "MEDIUM" as const,
        govLink: link("network-switching-core-standard", "Have a platform that can centrally manage the network switching infrastructure"),
      },
      {
        code: "switches-security-features",
        title: "The network switches should have security features to protect users and data from unauthorised access",
        description:
          "In plain English: network access controls so only recognised devices get onto the network, with configuration changes locked down to named, documented admin accounts.",
        sourceText: src({
          why: "School and college IT networks should prevent access by unauthorised users while giving time-limited access to regular and guest users.\n\nNetwork switching infrastructure without adequate security may allow unauthorised users access to secure information stored by the school or college, increasing the risk of a data breach or cyber incident.",
          how: "You should ask your supplier or IT support to ensure that switches are configured to support network segregation, security and quality of service. This should not impact the network's deployment or performance and should be aligned with the environment.\n\nAny administrative accounts that have access to make configuration changes, must be secure and fully documented.\n\nThe delivery of software updates should be set to automatically update as soon as they are available and manual checks should also be undertaken.",
          technical:
            "You should ensure that you have implemented network access controls (NACs) and policy management that ensures authorised mobile user devices or guest user roles are securely authenticated onto the network. Network traffic should be protected from external and unauthorised internal interception.\n\nHave central management tools that can be used to configure the network switches, monitor performance and provide alerts in the event of a failure.",
          when: "You should meet the standard when you need to replace your current solution that is underperforming, unsupported or following a scheduled maintenance or configuration review.",
        }),
        priority: "HIGH" as const,
        govLink: link("network-switching-core-standard", "The network switches should have security features to protect users and data from unauthorised access"),
      },
      {
        code: "core-switches-ups",
        title: "Core network switches should be connected to at least one UPS to reduce the impact of outages",
        description:
          "In plain English: the switches everything else depends on shouldn't have a single point of failure — 2 power supplies, 2 management modules, 2 links to other critical kit, and at least one battery backup (UPS) so a power blip doesn't take the whole network down.",
        sourceText: src({
          why: "Your school or college will have a high number of users accessing the network equipment at the same time. A power outage of part or all of the network would cause all equipment to stop working and result in disruption to teaching and administrative operations.",
          how: "Ask your supplier or IT support to make sure that critical switches and their connections have been identified to ensure any failure of any single element will not cause a major outage.\n\nThese will include items such as multiple power supplies, UPS solutions and dual connections between switches.",
          technical:
            "Critical core switches should have at least:\n\n- 2 power supplies\n- 2 management modules\n- 2 connections to other critical infrastructure such as routers, servers and other core switches\n\nThe critical core switches should be connected to at least one UPS.",
          when: "You should meet the standard when you need to replace your current solution that is underperforming, unsupported, or following a scheduled maintenance or configuration review.",
        }),
        guidance: "Critical core switches: 2 power supplies, 2 management modules, 2 critical-infrastructure links, ≥1 UPS.",
        priority: "HIGH" as const,
        govLink: link("network-switching-core-standard", "Core network switches should be connected to at least one UPS to reduce the impact of outages"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 4. Network cabling (not a core standard)
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/network-cabling
  // -------------------------------------------------------------------
  {
    code: "network-cabling",
    title: "Network cabling",
    description:
      "The physical cabling behind the walls has to be spec'd correctly, tested, and warrantied — it's invisible until it's the reason the network is slow.",
    officialUrl: `${GOV_BASE}/network-cabling`,
    items: [
      {
        code: "copper-cat6a",
        title: "Copper cabling should be Category 6A (Cat 6A)",
        description:
          "In plain English: any new or replaced copper network cable should be Cat 6A, run no further than 90m with no joins in the middle, and fitted to the correct fire-safety rating.",
        sourceText: src({
          why: "Category 6A cabling provides greater data capacity than previous copper cabling standards. It will provide schools and colleges the flexibility to increase the volume and specification of the technology they will need to connect to their networks.\n\nThe quality and specification of the school's or college's cabling (passive infrastructure) plays a critical role in making sure that data is transferred around the school. Faulty or low specification cabling will have a negative impact on the quality of network performance.",
          how: "You should confirm with your supplier or IT support that all cabling complies with British Standards 6701, 50173 and 50174, which cover the specification, installation, operation and maintenance of network cabling.",
          technical:
            "Although there are different variants of Category 6A cable, U/FTP – Unshielded outer shell/Foil Shielded Twisted Pair – is recommended as a minimum, with all terminations and installations following the manufacturer's guidelines.\n\nThe installed cable length (permanent link) should not be greater than 90m.\n\nNo intermediate splices or patch panels should be used in the cable runs. The minimum bend radius should not be exceeded during installation and when the cables are in their final operating position.\n\nFor new installations, cabling should comply with fire rating requirements defined in the latest version of British Standards 6701, currently stated as Euroclass Cca s1b.d2.a2.\n\nThe containment where the cables are installed should fully support the cables, as well as maintaining the required bend radius and separation from other types of cable and sources of interference.\n\nThe patch leads used to connect devices to the cabling infrastructure, are an important part of the overall cabling channel. It should be the same type and standard as the installed cable from the same manufacturer.",
          when: "You should meet the standard when you need to replace your current solution that is underperforming, in new school or college building projects, or when you upgrade your wireless network.",
        }),
        guidance: "Cat 6A minimum (U/FTP recommended); max 90m run; no splices or patch panels mid-run.",
        priority: "MEDIUM" as const,
        govLink: link("network-cabling", "Copper cabling should be Category 6A (Cat 6A)"),
      },
      {
        code: "fibre-om4",
        title: "Optical fibre cabling should be a minimum 16 core multi-mode OM4",
        description:
          "In plain English: cabling that links buildings or server/comms rooms together should be OM4 fibre, at least 16 cores, ideally run through underground ducts for protection, with a backup route for anything critical.",
        sourceText: src({
          why: "OM4 optical fibre cable provides capacity to transfer data over longer distances and plays a critical role in making sure that data is transferred around the school or college network effectively. This happens by linking server and hub rooms together either within the same building, or different buildings on the school or college campus. Faulty or low specification cabling will have a negative impact on the quality of network performance.",
          how: "You should confirm with your supplier or IT support that all cabling complies as a minimum with British Standards 6701, 50173 and 50174, which cover the specification, installation, operation and maintenance of network cabling.\n\nYou should also ensure that all connections between buildings use OM4 optical fibre cabling.",
          technical:
            "No intermediate splices or patch panels should be used in the cable runs. The minimum bend radius should not be exceeded during installation and when the cables are in their final operating position.\n\nWhere possible, optical fibre links between buildings should be installed in underground ducts, for maximum protection.\n\nFor critical systems, redundant optical fibre links should be considered through different routes between buildings.",
          when: "You should meet the standard when you need to replace your current solution that is underperforming and in new school or college building projects.",
        }),
        guidance: "Minimum 16-core multi-mode OM4 between buildings/hub rooms.",
        priority: "LOW" as const,
        govLink: link("network-cabling", "Optical fibre cabling should be a minimum 16 core multi-mode OM4"),
      },
      {
        code: "cabling-install-test-warranty",
        title: "New cabling should be installed and tested in line with the manufacturer's guidance, warranty terms and conditions",
        description:
          "In plain English: new cabling should go in via a manufacturer-approved installer, come with a test report proving it works, and carry a 20-year performance warranty on the whole system — not just the cable itself.",
        sourceText: src({
          why: "The quality and specification of your school's or college's cabling (passive infrastructure) plays a critical role in making sure that data is transferred around the school or college. Faulty or low-specification cabling will have a negative impact on the quality of network performance.",
          how: "You should confirm with your supplier or IT support that all new cabling complies with the relevant British Standards 6701, 50173 and 50174, which cover the specification, installation, operation and maintenance of network cabling.\n\nCables should be installed by manufacturer-approved installation partners, with the relevant network infrastructure installed accreditations.\n\nThe network infrastructure installer should also provide a detailed test report showing successful test results for all the installed network cables, based on the test limits defined in British Standards 50173.",
          technical: "A minimum 20-year manufacturer's performance warranty should be provided for the complete cabling system.",
          when: "You should meet the standard when you need to replace your current solution that is underperforming, and in new school or college building projects.",
        }),
        guidance: "Minimum 20-year manufacturer's performance warranty for the whole cabling system.",
        priority: "LOW" as const,
        govLink: link("network-cabling", "New cabling should be installed and tested in line with the manufacturer's guidance, warranty terms and conditions"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 5. Cyber security — core standard
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/cyber-security-core-standard
  // -------------------------------------------------------------------
  {
    code: "cyber-security",
    title: "Cyber security",
    description:
      "Keeping the school cyber secure: knowing your risks, training people, locking down devices and accounts, and having a plan for when (not if) something goes wrong.",
    officialUrl: `${GOV_BASE}/cyber-security-core-standard`,
    items: [
      {
        code: "cyber-risk-assessment",
        title: "Conduct a cyber risk assessment annually and review every term",
        description:
          "In plain English: once a year, work out what your biggest cyber risks actually are (not a generic checklist) and put a response plan in place; then every term, check whether anything's changed enough to revisit it.",
        sourceText: src({
          why: "Those in schools and colleges need to know the risks associated with their hardware, software and data to properly mitigate and defend against any potential cyber incidents or attacks.\n\nAssessing cyber risks means you can: understand how to keep students, staff and the wider school or college community safe; understand how prepared the school or college is in response to a cyber incident or attack; highlight weaknesses and put processes in place to help reduce risk; secure systems to make sure they are more resilient to cyber incidents and attacks; prepare a cyber response plan to be implemented quickly in the event of a serious incident to minimise any impact to the school or college.\n\nNot identifying and assessing risk, or preparing a response, could lead to: safeguarding issues if students' safeguarding information is unavailable or if confidential data is accessed and misused; lasting disruption to the operation of the school or college, including closure; significant impact on student outcomes; other schools or colleges on your broader organisational network being impacted by the same cyber incident or attack; a significant data breach; reputational damage; significant unexpected spend and lost staff time to recover systems and data.",
          how: "This standard should be a part of your overall digital technology strategy.\n\nThe SLT digital lead and your IT support will review digital technology assets and any related cyber security risk, and check all digital technology is licensed, supported and updated.\n\nThe SLT digital lead will work with the data protection officer to complete a record of processing activities (ROPA) for all new and current systems storing or processing personal and sensitive personal data, and to assess staff access and permissions to systems and data, and check password policies.\n\nIT support will keep documentation on your network up to date – this should include network diagrams, changes that are made, settings and IP addressing information – and discuss the level of logging required for your network and systems.\n\nThe SLT digital lead will work with the business professionals or finance team, estate management and IT support to create a simple reporting structure for cyber risks to be captured, escalated and actioned – cyber risks should be captured in the risk register and placed into a regularly tested business continuity plan – and to put a cyber response plan in place.\n\nWe recommend getting insurance cover to help minimise costs in the event of a cyber incident or attack. You could consider the Department for Education's (DfE) risk protection arrangement (RPA) cover as an alternative to commercial insurance.",
          technical:
            "Understand what the greatest cyber risks are and establish the likelihood of these happening, along with the impact they may have on your school or college.\n\nCapture how many cyber incidents or attacks have already occurred and what they are so that you can understand common themes and know where you need to improve.\n\nIdentify any student or staff behaviour that may be seen as a risk and could expose the school or college to a cyber incident or attack.\n\nMaintain documentation and your business continuity plan in at least one or more (diverse) locations – for example, in the cloud or as a hard copy.",
          when: "You should complete any risk assessments as soon as possible and repeat them every year or in the event of significant technology or process changes, or an incident or attack impacting the school or college.\n\nThese risk assessments should then be revisited every term to see if anything has significantly changed.",
        }),
        priority: "HIGH" as const,
        govLink: link("cyber-security-core-standard", "Conduct a cyber risk assessment annually and review every term"),
      },
      {
        code: "cyber-awareness-plan",
        title: "Create and implement a cyber awareness plan for students and staff",
        description:
          "In plain English: have a written acceptable use policy and give everyone — staff, students, governors, supply/agency staff with logins — annual cyber training covering phishing, passwords, and how to report an incident. If you have RPA cover, that training must be the free NCSC one, taken every year.",
        sourceText: src({
          why: "Well-informed users are the best line of defence against cyber criminals. Many cyber incidents and attacks target common processes and human behaviours when using digital technology.\n\nRaising awareness, and training students and staff on cyber security will: reduce the risk of cyber incidents and attacks; help to keep students and staff safe; help to create a culture where students and staff feel comfortable identifying and reporting risk; help students and staff understand what acceptable use of digital technology looks like and the importance of cyber security; make sure that cyber incidents, attacks and risks are reported quickly to stop them spreading.\n\nIf students and staff do not understand the risks, this could lead to safeguarding issues, particularly when data is breached, and cyber incidents and attacks that are costly and disruptive.",
          how: "The SLT digital lead will work with IT support to make sure an acceptable use policy is created and updated to meet their school or college's needs, and that regular and up to date training and awareness activities on cyber security are carried out.\n\nAnyone who has access to the school or college network or data will need to be made aware of, and sign up to, the acceptable use policy. This will include guests and supply teachers who want to use the school or college network and wifi.\n\nCyber training should be given at least annually, or more regularly if there is a known cyber risk, to: students; staff; at least one current governor or trustee; anyone else with a login (for example supply teachers or agency workers).",
          technical:
            "Training should be age-appropriate and suited to your school or college's risks, but should generally include training on: methods hackers use for tricking people into disclosing personal information, including phishing; password security; online safety; social engineering; the physical security of devices, for example not leaving a laptop unlocked and unattended; the risks of using removable storage media, such as USBs; multi-factor authentication; how to report a cyber incident or attack; how to report a personal data breach; data protection for all staff, with staff who are exposed to higher risk data having more frequent training.\n\nIf you have risk protection arrangement, you must evidence that the relevant users have undertaken the free National Cyber Security Centre (NCSC) training. This needs to be taken annually.",
          when: "You should already have an acceptable use policy in place. If you have not carried out cyber training in your school or college within the last 12 months, then you should plan to implement this as soon as possible.",
        }),
        guidance: "Annual cyber training for all staff/students/≥1 governor; RPA cover requires the free NCSC training yearly.",
        priority: "HIGH" as const,
        govLink: link("cyber-security-core-standard", "Create and implement a cyber awareness plan for students and staff"),
      },
      {
        code: "anti-malware-firewall",
        title: "Secure digital technology and data with anti-malware and a firewall",
        description:
          "In plain English: every device needs a properly configured firewall and centrally-managed, up-to-date anti-malware software. USB storage should be blocked by default. Firewall admin access needs MFA, and inbound traffic should be blocked by default unless there's a documented reason to allow it.",
        sourceText: src({
          why: "Creating and maintaining the security around your digital technology and data is a critical line of defence against a cyber incident or attack. Once a virus or hacker is in your system, they will look for a way to exploit other vulnerabilities.\n\nNot meeting this standard could lead to: lost learning or possible school or college closure; not being able to access child protection data; students and staff being exposed to inappropriate content; a large financial cost; a significant data breach; the spread of viruses or malware throughout your network; security weaknesses, which make cyber incidents or attacks easier against your network.",
          how: "IT support will need to use a properly configured boundary firewall, make sure devices are safe and secure, install anti-malware software (this must include anti-virus) on all devices — this should be centrally managed, actively monitored and kept up to date — and monitor digital technology for any potential cyber security incidents or attacks.",
          technical:
            "Firewall: protect digital technology with a correctly configured boundary firewall or software firewall, including protection against denial of service attacks; keep boundary firewall firmware up to date, checked termly; change the default administrator password and restrict remote access to those who need it; protect access to the firewall's administrative interface with multi-factor authentication where available; actively monitor firewall traffic and switch on firewall alerts; block inbound unauthenticated connections by default; document and review why inbound traffic has been permitted, at least termly, signed off by the SLT digital lead; keep firewall rules to an absolute minimum, each one documented and risk-assessed; enable a software firewall for digital technology used outside the school; consider a VPN to encrypt data in transit.\n\nAnti-malware software must: scan web pages as they are being used; have a centralised monitoring console; scan files and applications upon access, download or opening; scan email attachments (incoming and outgoing); send malware alerts to IT support; prevent access to potentially malicious websites.\n\nIT support should prohibit the use of USB storage devices by default, unless for a specific need (for example, if the examination board requires it); if permitted, the anti-malware software should scan the USB drive before it is made available.",
          when: "This standard should already be in place for the security of your network.",
        }),
        priority: "HIGH" as const,
        govLink: link("cyber-security-core-standard", "Secure digital technology and data with anti-malware and a firewall"),
      },
      {
        code: "user-accounts-access-privileges",
        title: "Control and secure user accounts and access privileges",
        description:
          "In plain English: unique logins for everyone, strong passwords, and multi-factor authentication (MFA) switched on for all staff cloud/remote-access accounts and all IT admin accounts. Accounts should be reviewed every term, and disabled the moment someone leaves.",
        sourceText: src({
          why: "Protecting user accounts and related data is a critical line of defence against cyber incidents and attacks.\n\nNot meeting this standard could lead to: schools and colleges being exposed to external and internal threats; a significant data breach; students and staff being exposed to inappropriate content; a disruptive and costly ransomware attack; not being covered by your insurer for cyber attacks and incidents.",
          how: "The SLT digital lead will plan how users get access, password policies, and security features such as multi-factor authentication (MFA) where needed, with IT support. IT support should make sure that users only have the network and data access they need, and that their account is secure.",
          technical:
            "Passwords must be unique to the user, protected from unauthorised access, and supported by technical controls that reduce the risk of compromise. IT support should enforce password strength at the system level and protect all passwords — for example, by allowing no more than 10 guesses in 5 minutes, or locking devices after no more than 10 unsuccessful attempts.\n\nMulti-factor authentication (MFA) must be enabled for all staff accounts with access to cloud services or remote access to on-site systems, and all IT administrative accounts. MFA should include at least 2 of: a password; a text message code; an automated phone call; a secure portable device; a security key; a known/trusted account; a biometric test.\n\nAccount management: IT support need to control user accounts and access privileges by creating accounts only when required, limiting access privileges to only what the user needs, disabling accounts as soon as someone leaves their role, and reviewing accounts with the business professionals/finance team every term. Global or administrative accounts should not be used for routine business — dedicated accounts should have enhanced privileges instead. A member of SLT or a trustee should approve any changes to access levels before IT support actions the change, and SLT should have access to a dedicated administrative account for emergencies.",
          when: "You should already be meeting this standard. If not, implement it as soon as possible through a structured, well managed rollout plan.",
        }),
        guidance: "MFA required for all staff cloud/remote accounts and all IT admin accounts.",
        priority: "HIGH" as const,
        govLink: link("cyber-security-core-standard", "Control and secure user accounts and access privileges"),
      },
      {
        code: "license-update-technology",
        title: "License digital technology and keep it up to date",
        description:
          "In plain English: nothing unlicensed, and nothing left unpatched. High/critical-severity fixes must go on within 14 days of release. Unsupported software/operating systems should be flagged for replacement before they go out of support.",
        sourceText: src({
          why: "All digital technology must be licensed.\n\nNot licensing or updating digital technology could lead to: devices being vulnerable to viruses, malware and hackers; reputational damage; sudden unexpected costs from having to replace digital technology; operating systems that have reached end-of-life or are not providing critical security updates; software or applications not being able to run, which could lead to disrupting teaching and learning; a breach of your licensing agreement, which could lead to fines or action from the supplier.",
          how: "IT support will need to check all digital technology is licensed, supported and set up to meet the technical requirements. The end of support dates for each device's operating system should be recorded in the asset register.\n\nAt the end of every term, IT support and the business professionals/finance team should review the contracts register and inform the SLT when digital technology has become, or is due to become, unsupported.\n\nOccasionally DfE may issue instructions on security updates — IT support should apply these within 5 working days of notification.",
          technical:
            "Licensing: all software needs to be licensed and eligible for security updates; remove unlicensed software or take steps to license it; licence expiry dates should be recorded in the contracts register; digital technology end-of-support dates should be captured in the asset register.\n\nSecurity updates: IT support must complete vulnerability fixes for operating systems, applications and firmware within 14 days of the fix being released, when the vendor describes the vulnerability as critical or high risk, the vulnerability has a CVSSv3.1 base score of 7.0 or above, or the vendor does not provide a severity rating. IT support should also isolate devices where high-risk patches are unavailable.",
          when: "You should already be meeting this standard with existing digital technology. When buying new digital technology (including cloud-based services), you will need to check that it meets this standard.",
        }),
        guidance: "Critical/high-severity (CVSS ≥7.0) fixes applied within 14 days of release.",
        priority: "MEDIUM" as const,
        govLink: link("cyber-security-core-standard", "License digital technology and keep it up to date"),
      },
      {
        code: "backup-data-plan",
        title: "Develop and implement a plan to back up your data and review this every year",
        description:
          "In plain English: the classic \"3-2-1\" rule — at least 3 copies of important data, on at least 2 different devices, with at least 1 copy offsite (cloud counts). Backups need to be immutable (can't be altered once written) and tested regularly by actually restoring from them, not just assumed to work.",
        sourceText: src({
          why: "Schools and colleges are now more reliant on digital technology and data being stored in different locations (such as cloud services). Not all of these will be backed up to meet the needs of the school or college (for example, cloud services will only backup your data for a limited time period), so you need to have a backup plan to meet your diverse needs.\n\nThis standard will help your school or college to: recover important data and systems to continue teaching and resume normal business operations in the event of a cyber incident or attack; manage recovery of damaged or lost files; be compliant with data protection legislation.\n\nNot meeting this standard could lead to: operational impacts due to systems and data being unavailable; the loss of student work; critical safeguarding systems not being available; lost, misused or damaged data; a breach of data protection legislation; unexpected costs from bringing in specialists to help recover your systems and data.",
          how: "Your backup plan should feed into your business continuity plan and disaster recovery plan. The backup plan should be kept up to date, tested termly to make sure it works (or more often if there is a significant service change), and reviewed on an annual basis, or when there is a major change to the systems or data.\n\nThe SLT digital lead should establish what data is currently being backed up, how often, how old it is, and how it is being backed up — including data stored on all cloud services.",
          technical:
            "IT support should have at least 3 backup copies of important data, on at least 2 separate devices – at least one of these copies must be off-site.\n\nMake sure that backups are immutable, meaning they cannot be changed once they have been created – this helps prevent data loss and reduces the risk of malware or ransomware being introduced into your systems when restoring data.\n\nTest and log your backups termly or if there is a significant change, this should include the ability to recover and restore from backups.\n\nYou should not take any physical backups offsite unless they are encrypted and stored in a secure location. Regardless of whether they are encrypted, backups should never be taken to anyone's home.",
          when: "You must backup your data now. If you have not yet done so, you should develop a backup plan as soon as possible.",
        }),
        guidance: "3-2-1 rule: ≥3 copies, ≥2 devices, ≥1 offsite — immutable, tested termly.",
        priority: "HIGH" as const,
        govLink: link("cyber-security-core-standard", "Develop and implement a plan to back up your data and review this every year"),
      },
      {
        code: "report-cyber-attacks",
        title: "Report cyber attacks",
        description:
          "In plain English: everyone — staff and students — should know how to report a suspected cyber incident to IT support and the SLT digital lead immediately. Serious incidents also need reporting externally: to your RPA/cyber insurer, Action Fraud, DfE's sector cyber team, and sometimes the NCSC or ICO too.",
        sourceText: src({
          why: "A cyber incident or attack will often be an intentional and unauthorised attempt to access, change or damage data and digital technology. They could be made by a person, group, or organisation outside or inside the school or college.\n\nEveryone is responsible for and should report a cyber incident or attack to their IT support and senior leadership (SLT) digital lead.\n\nFailure to report and act quickly could lead to: an increase in severity and spread of a cyber incident or attack; damage to data and systems; a data breach which may need to be reported to the Information Commissioner's Office (ICO); other schools or colleges on your broader organisational network being impacted by the same cyber incident or attack; time spent wiping devices and servers to return to a previous safe state.",
          how: "All students and staff have a responsibility to report cyber risk or a potential incident or attack to IT support and the SLT digital lead, who will action their cyber incident response plan, contain the risk, notify relevant people, capture information on the risk, investigate and decide on the next course of action, and report the potential incident or attack to the governing body or trustees.\n\nAny incidents, attacks or near misses should be recorded in an internal incident report or system.",
          technical:
            "Incidents or attacks where any security breaches may have taken place, or other damage was caused, should be reported to an external body:\n\n- your RPA or cyber insurance provider\n- Report Fraud on 0300 123 2040, or the Report Fraud website\n- the DfE sector cyber team at Sector.Incidentreporting@education.gov.uk\n\nYou may also need to report it to: the NCSC website, if the incident or attack causes long-term school closure, the closure of more than one school, or serious financial damage; the ICO website within 72 hours, where a high-risk data breach has or may have occurred; Jisc, if you are part of a further education institution.",
          when: "You should already be meeting this standard. If you do not have these procedures in place, then you should implement them as soon as possible.",
        }),
        guidance: "High-risk data breach must be reported to the ICO within 72 hours.",
        priority: "MEDIUM" as const,
        govLink: link("cyber-security-core-standard", "Report cyber attacks"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 6. Filtering and monitoring — core standard
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/filtering-and-monitoring-core-standard
  // -------------------------------------------------------------------
  {
    code: "filtering-monitoring",
    title: "Filtering and monitoring",
    description:
      "Filtering stops students reaching harmful content; monitoring spots concerning behaviour on school devices. Both need named owners, a yearly review, and checks that they actually work.",
    officialUrl: `${GOV_BASE}/filtering-and-monitoring-core-standard`,
    items: [
      {
        code: "filtering-roles-responsibilities",
        title: "Identify and assign roles and responsibilities to manage your filtering and monitoring systems",
        description:
          "In plain English: someone on SLT and a governor need to own this, and it needs to be clear who in IT support and who as DSL does what — not left vague between the two.",
        sourceText: src({
          why: "Schools and colleges should provide a safe environment to learn and work, including when online. Filtering and monitoring are both important parts of safeguarding students and staff from illegal, inappropriate and potentially harmful material.\n\nClear roles, responsibilities and strategies are vital for delivering and maintaining effective filtering and monitoring systems. It's important that your designated safeguarding lead (DSL) and IT support work together, using their professional expertise to make informed decisions. Governors and your senior leadership team (SLT) should provide support as required.",
          how: "Governing bodies and proprietors have overall strategic responsibility for filtering and monitoring and need assurance that the standards are being met. To do this, they should identify and assign a member of the SLT and a governor to be responsible for ensuring these standards are met, and the roles and responsibilities of staff and third parties.\n\nThe SLT is responsible for scoping needs (including generative AI), buying systems, documenting decisions on what is blocked or allowed and why, governance, reviewing effectiveness, and overseeing reports. Your DSL should lead on safeguarding and online safety, checking relevant reports, responding to safeguarding concerns, and providing governors with assurance. Your IT support has technical responsibility for maintaining systems, providing reports, and completing actions following concerns or checks.",
          technical:
            "AI-generated content is increasingly used in mobile and desktop apps and web browsers. Schools and colleges should consider the safeguarding implications of this when reviewing their filtering and monitoring systems, referring to the Generative AI: product safety standards when introducing specific generative AI products.",
          when: "You should already be meeting this standard.",
        }),
        priority: "HIGH" as const,
        govLink: link("filtering-and-monitoring-core-standard", "Identify and assign roles and responsibilities to manage your filtering and monitoring systems"),
      },
      {
        code: "filtering-annual-review",
        title: "Review your filtering and monitoring provision at least annually",
        description:
          "In plain English: once a year (minimum), SLT + DSL + IT support + a governor sit down and actually test what's blocked, what's not, and whether it still matches the school's real risk profile — and write down what they found.",
        sourceText: src({
          why: "For filtering and monitoring to be effective it should meet the needs of your students and staff. It should reflect your specific use of technology while minimising potential harms.\n\nThe review process should identify additional filtering and monitoring checks that are needed. This will give governing bodies and proprietors assurance that systems are working effectively and meeting safeguarding obligations.",
          how: "Governing bodies and proprietors have overall strategic responsibility for meeting this standard. They should make sure that filtering and monitoring provision is reviewed at least once every academic year to meet their specific needs.\n\nThe yearly review should be conducted by members of the senior leadership team, the designated safeguarding lead and IT support. It should also involve the responsible governor. You should record the results of the review and document any actions taken.",
          technical:
            "A review of filtering and monitoring should be carried out to identify your current provision, any gaps, and your students' and staff's specific needs — including student risk profile (age, SEND, EAL), what's currently blocked/allowed, BYOD policy, use of generative AI, technical limitations, safeguarding incidents, and existing policies.\n\nThe review should take place, as a minimum, once every academic year or when: a safeguarding risk is identified; there is a change in working practice, like remote access or BYOD; new technology is introduced; major software updates occur; there are changes to the technical configuration of the network and devices.\n\nChecks to your filtering provision need to be completed and recorded as part of your review process, from both a safeguarding and IT perspective, and should include checking school/college-owned devices and services, different locations/sites, and that user group accounts are filtering the correct content for students, staff and guests. You can use testing tools such as the one provided by South West Grid for Learning (SWGfL) to check that, as a minimum, your filtering system is blocking access to illegal child abuse material, unlawful terrorist content and adult content.",
          when: "You should already be meeting this standard.",
        }),
        guidance: "Full review at least once every academic year, by SLT + DSL + IT support + governor.",
        priority: "MEDIUM" as const,
        govLink: link("filtering-and-monitoring-core-standard", "Review your filtering and monitoring provision at least annually"),
      },
      {
        code: "filtering-blocks-harmful-content",
        title: "Filtering systems should block harmful and inappropriate content without unreasonably impacting teaching and learning",
        description:
          "In plain English: your filtering provider must be a member of the Internet Watch Foundation and signed up to CTIRU, and those blocklists must not be switchable-off by anyone, including IT admins. Filtering has to cover every school-managed device and BYOD device on a separate network, and block workarounds like VPNs and proxies.",
        sourceText: src({
          why: "An active and well-managed filtering system is an important part of providing a safe environment for students to learn.\n\nNo filtering system can be 100% effective. You need to understand your filtering system's coverage and any limitations, and mitigate against these to minimise harm and meet your statutory duties.\n\nAn effective filtering system needs to block internet access to harmful sites and inappropriate content. It should not unreasonably impact teaching and learning or school or college administration, or restrict students from learning how to assess and manage risk themselves.",
          how: "Governing bodies and proprietors need to support the SLT to procure and set up systems which meet this standard and satisfy your school or college risk profile. This may need to be different for different user types, year groups and subjects.\n\nYour filtering system should not have a blanket filtering profile for all users — as a minimum, student and staff profiles should be in place to provide differing levels of access.",
          technical:
            "The Internet Watch Foundation (IWF) and Counter-Terrorism Internet Referral Unit (CTIRU) provide blocklists of illegal websites. Schools and colleges must make sure these blocklists are implemented and cannot be disabled, overridden, or altered by any user, including system administrators, at any level. Your filtering provider must be a member of IWF and signed up to CTIRU, regularly updating blocklists.\n\nYour filtering system should be active, up to date and applied to all school/college-managed devices (including those taken off-site), unmanaged BYOD devices, and guests. Devices that are not school or college-managed should be on a separate virtual network.\n\nCheck with your provider whether your system: identifies and appropriately filters all internet feeds; is appropriate for age and ability; identifies multilingual content, common misspellings and abbreviations; provides alerts when content has been blocked; blocks VPNs, proxy services and end-to-end encryption methods used to bypass filtering.\n\nYour filtering systems should allow you to identify, as a minimum: device name or ID, IP address, and where possible the individual; the time and date of attempted access; the search term or content being blocked.\n\nSearch engines used should have safe search enabled by default and locked in, and users should not be able to download additional browsers or unauthorised plugins.",
          when: "You should already be meeting this standard.",
        }),
        guidance: "Filtering provider must be an IWF member, signed up to CTIRU; blocklists cannot be disabled by anyone, including admins.",
        priority: "HIGH" as const,
        govLink: link("filtering-and-monitoring-core-standard", "Filtering systems should block harmful and inappropriate content without unreasonably impacting teaching and learning"),
      },
      {
        code: "monitoring-strategies",
        title: "Have effective monitoring strategies that meet the safeguarding needs of your school or college",
        description:
          "In plain English: monitoring doesn't block anything — it watches and reports. You need at least weekly reports plus same-day alerts for anything high-risk, a documented process for who acts on what, and everyone needs to know devices are being monitored.",
        sourceText: src({
          why: "Monitoring user activity on school and college devices is an important part of providing a safe environment for students and staff. Unlike filtering, it does not stop users from accessing material through internet searches or software.\n\nFor monitoring to be effective it must pick up incidents that are of concern urgently, usually through alerts or observations, allowing you to take prompt action and record the outcome.",
          how: "All staff should conduct a level of in-person monitoring if they are in a room with students on devices, as part of wider classroom supervision. Some schools and colleges may decide to have additional technical monitoring solutions in place to reduce any risks identified during the review.\n\nThe designated safeguarding lead (DSL) is responsible for any safeguarding and child protection matters that are identified through monitoring.",
          technical:
            "Your monitoring plan should include how you will monitor students when using school-managed devices connected to the internet — this could include device monitoring, in-person monitoring, and network monitoring using log files.\n\nAs a minimum, your monitoring plan should include weekly monitoring reports highlighting incidents, plus immediate reports when an incident is classed as high-risk.\n\nMake sure that everyone using your school's network knows that filtering and monitoring processes are in place. Technical monitoring systems should also notify users that the device is being monitored.\n\nThere should be a documented process for recording incidents that includes what action was taken and the outcomes.\n\nMake sure that monitoring data is received in a format that your staff can understand, and that users are identifiable to the school or college so concerns can be traced back to an individual.",
          when: "You should already be meeting this standard.",
        }),
        guidance: "Minimum: weekly monitoring reports + same-day reporting for high-risk incidents.",
        priority: "HIGH" as const,
        govLink: link("filtering-and-monitoring-core-standard", "Have effective monitoring strategies that meet the safeguarding needs of your school or college"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 7. Digital leadership and governance — core standard
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/digital-leadership-and-governance-core-standard
  // -------------------------------------------------------------------
  {
    code: "digital-leadership",
    title: "Digital leadership and governance",
    description:
      "Someone named needs to own digital technology strategically, the school needs to actually know what hardware/software/data it holds, there needs to be a plan for when things go wrong, and all of that needs reviewing every year.",
    officialUrl: `${GOV_BASE}/digital-leadership-and-governance-core-standard`,
    items: [
      {
        code: "slt-digital-lead",
        title: "Assign a senior leadership team (SLT) member to be responsible for digital technology",
        description:
          "In plain English: name one person on SLT (the \"SLT digital lead\") who owns the digital technology strategy, links IT support/DPO/DSL/finance together, and is accountable for training and IT support's effectiveness. They don't need to be technical.",
        sourceText: src({
          why: "Schools and colleges need a member of their SLT to have strategic oversight of all digital technology and how it fits with their development plan, create and manage the digital technology strategy led by the needs of staff and students (not the technology itself), help all staff to embed digital technology that meets staff and student needs.\n\nWithout this focus, there's a risk that: the use of technology will only meet short-term needs that could potentially lead to additional unplanned costs; schools and colleges will be exposed to safeguarding and security issues; new digital technology will not be compatible with existing technology used by the school or college.",
          how: "The headteacher or principal should appoint someone who is responsible for digital technology. They do not need to be an expert, but some technical knowledge or interest could be advantageous for this role.\n\nThey will be accountable for: the delivery of the digital technology strategy based on teaching and learning outcomes and organisational needs; encouraging and supporting the use of digital technology across the school or college; reviewing the effectiveness of IT support to inform decision making and taking action, when necessary; identifying and acting on digital technology training needs for staff and students.\n\nGovernors or trustees should also consider assigning a digital link role within the governing body or board of trustees.",
          when: "You will need to assign the role of the SLT digital lead within your school or college before you can create your digital technology strategy.",
        }),
        priority: "HIGH" as const,
        govLink: link("digital-leadership-and-governance-core-standard", "Assign a senior leadership team (SLT) member to be responsible for digital technology"),
      },
      {
        code: "hardware-registers-up-to-date",
        title: "Keep registers relating to hardware and systems up to date",
        description:
          "In plain English: three live registers — contracts (licences/subscriptions/renewal dates), assets (every device, serial number, owner, age, disposal date) and information assets (what personal data lives where). DfE has free templates for all three on the plan technology for your school service.",
        sourceText: src({
          why: "A contracts register, asset register and information asset register will help your school or college to understand what digital data, equipment and systems you have, manage them effectively, and keep track of buying and licensing so that schools or colleges can get better value for money when renewing software and hardware.\n\nNot having these registers in place could lead to: budget pressures due to accidental renewal of subscriptions, software and hardware that might not be needed; safeguarding and cyber security issues as software might not be up to date; lost learning and workload burdens if software or hardware is not budgeted for or supported.",
          how: "Schools and colleges should include digital technology within their contracts register, asset register and information asset register (IAR).\n\nContracts register: includes licences, subscriptions, contracts related to broadband/IT support/technology provider, and a list of approved apps. Commercial/procurement information should be updated by the business or finance team, technical information by IT support.\n\nAsset register: a log of all physical digital technology — what equipment, asset/serial numbers, who it is assigned to, where, when purchased, how old it is, when due for review, date securely disposed of. The SLT digital lead owns this register.\n\nInformation asset register (IAR): a log of the digital data held on staff and students, owned by the data protection officer.",
          when: "You should already be updating your registers every time something changes. The SLT digital lead should review these registers ahead of your next financial planning cycle.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("digital-leadership-and-governance-core-standard", "Keep registers relating to hardware and systems up to date"),
      },
      {
        code: "disaster-recovery-business-continuity",
        title: "Include digital technology within disaster recovery and business continuity plans",
        description:
          "In plain English: write down what counts as a \"disaster\" for your IT, who's on the response team and how to reach them, and test the plan at least once a year. Keep a copy both printed and in a secure cloud folder — if your systems are down, you need the plan to still be readable.",
        sourceText: src({
          why: "You should have a process in place to review and update the disaster recovery and business continuity plans, including those related to digital technology.\n\nNot doing so will risk: significant disruption to a school or college in the event of a disaster, such as a cyber attack; unplanned spend from a disaster that was not expected; potential loss of data or a data breach.",
          how: "Digital technology should work with your existing business continuity and disaster recovery plans. Both plans need to be reviewed and updated annually or when a significant change occurs.\n\nOnce your plans have been completed, you should create a summary document with top-level details (such as key contacts) to be shared securely with all staff. The plans should be printed out to retain hard copies in case of an emergency, and kept online in a secure, shared folder location in the cloud.\n\nDisaster recovery plan: a living document to use when a disaster takes place, tested annually (at a minimum), including a definition of what a disaster means to your school or college, details of your disaster recovery team and key contacts, and how you will test the plan.\n\nBusiness continuity plan: looks at assessing risks of digital technology, steps to reduce risk, and actions needed if risk occurs and there is a need for recovery.",
          when: "Insurance companies may ask all schools and colleges for these documents as part of risk management. So you should already be meeting this standard or be working towards it.",
        }),
        priority: "HIGH" as const,
        govLink: link("digital-leadership-and-governance-core-standard", "Include digital technology within disaster recovery and business continuity plans"),
      },
      {
        code: "digital-technology-strategy",
        title: "Have a digital technology strategy that is reviewed every year",
        description:
          "In plain English: a written, minimum 2-year digital strategy that actually supports the school's development plan — not bought because a salesperson was convincing. Review it every year. You should only start this once the SLT digital lead role, registers, and disaster recovery plan (the 3 standards above) are already in place.",
        sourceText: src({
          why: "Creating a digital technology strategy that is aligned with your development plan will help to make sure: the digital technology used meets the needs of staff and students; your budget, buying decisions and any risks are managed; staff and students receive the training they need to use digital technology safely and effectively; you can assess the impact of digital technology against your strategy.\n\nNot having a strategy in place could lead to: disrupted learning if the digital technology does not support curriculum delivery; potential compromises to safeguarding; an increased risk of a cyber attack; budget pressures if digital technology systems fail and need to be replaced; buying digital technology that is not suitable for the school or college's educational vision; a lack of resources to support the use and replacement of digital technology.",
          how: "The SLT digital lead will need to understand the school or college's development plan to make sure the digital technology strategy supports this, and gather information on contracts and assets, current and committed spend, risks (disaster recovery/business continuity), what technology students have access to outside of school, and training needs.\n\nThe SLT digital lead should develop a longer-term vision for digital technology, informed by stakeholders and by visiting other schools and colleges with similar needs, which should support the school or college's development plan and educational vision and should be sustainable and minimise the impact on the environment.\n\nOnce the vision has been finalised, the SLT digital lead should create a minimum 2-year strategy, revisiting and reviewing it annually (at a minimum) and sharing a top-level summary with key stakeholders.",
          when: "To meet this standard, you will need to have met the previous 3 standards (SLT digital lead, registers, disaster recovery and business continuity plans). Once you have completed those, this standard can then be completed before your next budget cycle.",
        }),
        guidance: "Minimum 2-year strategy, reviewed at least annually.",
        priority: "MEDIUM" as const,
        govLink: link("digital-leadership-and-governance-core-standard", "Have a digital technology strategy that is reviewed every year"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 8. Servers and storage (not a core standard)
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/servers-and-storage
  // -------------------------------------------------------------------
  {
    code: "servers",
    title: "Servers and storage",
    description:
      "Any servers still running on-site (rather than in the cloud) need to be resilient, secure, energy-efficient, and physically housed somewhere properly built for the job — not a cupboard that doubles as a stationery store.",
    officialUrl: `${GOV_BASE}/servers-and-storage`,
    items: [
      {
        code: "server-resilience",
        title: "All servers and related storage platforms should continue to work if any single component or service fails",
        description:
          "In plain English: a server holding anything critical needs dual power supplies, a UPS with at least 30 minutes' runtime, mirrored/redundant disks, and regular backups — so one failed part doesn't take the whole thing down.",
        sourceText: src({
          why: "Servers and related storage platforms designed to be secure and resilient will be more reliable, make sure your IT support can monitor performance and alert you if a component or service fails, and minimise the risk of systems and data being unavailable.\n\nNot meeting this standard could lead to: a loss of data; difficulties running your school or college; an increased risk of a cyber attack or incident; your school or college temporarily closing.",
          how: "Using cloud solutions reduces the need for local servers — reading the cloud standards with your IT support will help you assess where you can replace or reduce server resources.\n\nAsk your IT support to set up your servers and related storage platforms to meet the technical requirements of this standard. Your senior leadership team will need to decide the maximum downtime it is willing to accept, based on the sensitivity of the system/data and its importance to running the school.",
          technical:
            "For all servers make sure that you have: IT support monitoring performance and alerting you if a component or service fails; processes to replace failing components quickly; valid manufacturer warranties and support agreements; a process to keep patches and firmware up to date; a process to replace servers approaching end of warranty/support/life.\n\nServers containing critical data should have at least: multiple power supplies which switch seamlessly if power fails; a UPS with automatic, safe shutdown and a minimum of 30 minutes run-time; a hard disk set up with mirroring, redundancy, or both; a regular backup of systems and data; backup servers (onsite or cloud) and network cards that switch over seamlessly; valid manufacturer warranties with service levels matched to how critical the data is.",
          when: "You should already be meeting this standard to help safeguard, protect and secure your data and systems. It is also a requirement for meeting data protection legislation.",
        }),
        guidance: "Critical servers: dual power supplies, UPS ≥30 min runtime, mirrored/redundant disks.",
        priority: "HIGH" as const,
        govLink: link("servers-and-storage", "All servers and related storage platforms should continue to work if any single component or service fails"),
      },
      {
        code: "server-secure-data-protection",
        title: "Servers and related storage platforms must be secure and follow data protection legislation",
        description:
          "In plain English: servers have to be \"secure by design\" — which in practice means following the NCSC's 10 Steps to Cyber Security, running a data protection impact assessment on anything holding personal data, and having a clear joiner/leaver account process.",
        sourceText: src({
          why: "To meet data protection legislation all IT systems and services must be 'secure by design'.\n\nYou need to make sure your servers and related storage platforms are secure and risks are minimised when you buy, install and use them. This could include physical damage (flooding, fire), virtual damage (cyber attack), or human error through poor management.",
          how: "Ask your IT support to set up new and existing devices to meet the technical requirements of this standard. Your IT support should consult with your data protection officer (DPO) on data protection issues such as data retention and sharing.\n\nWhen buying any new systems or services, you should make sure systems and services are secure. School business professionals and IT support should work together to choose suppliers on the basis of their ability to meet the technical requirements.",
          technical:
            "To meet this standard your IT support must: meet the cyber security standards for schools and colleges; make sure that your servers and related storage platforms are secure, licensed, updated and well-managed; review your existing systems and services whenever you make a change or at least each term.\n\nYour DPO should carry out data protection impact assessments (DPIA) for any server and related storage solutions that store personal and/or sensitive personal data.\n\nAll systems need to follow the National Cyber Security Centre (NCSC) 10 Steps to Cyber Security guidelines. Make sure there is a user account creation, approval and removal process that is part of your school's joining and leaving protocols, and that roles and responsibilities for dealing with a data breach are clearly documented.",
          when: "You should already be meeting this standard to comply with data protection legislation.",
        }),
        priority: "HIGH" as const,
        govLink: link("servers-and-storage", "Servers and related storage platforms must be secure and follow data protection legislation"),
      },
      {
        code: "server-energy-efficiency",
        title: "All servers and related storage platforms should be energy-efficient and set up to reduce power consumption, while still meeting user needs",
        description:
          "In plain English: power-save servers when idle (as long as it doesn't hurt backups or performance), and when buying new ones specify ENERGY STAR or equivalent — don't buy more capacity than you actually need.",
        sourceText: src({
          why: "Local servers and their storage platforms run continuously. This means they can use a lot of energy.\n\nAn energy efficient approach to buying, setting up and using servers and related storage platforms will save energy and money.",
          how: "School business professionals and IT support should work together to make sure energy efficiency is a stated requirement in all server and related storage platform procurements, and that existing platforms are set for the highest level of energy efficiency while still meeting user needs for speed and ease of use.\n\nUsing cloud solutions increases your overall energy efficiency.",
          technical:
            "Make sure your servers and related storage platforms are energy efficient by using power saving when they're inactive (as long as this does not significantly reduce performance, prevent backups, or risk damage), and turning off any features which are not used.\n\nWhen buying servers and related storage platforms make sure you: specify servers designed to be energy efficient, with the ENERGY STAR label or equivalent; include a requirement that all platforms are set up to reduce energy consumption as much as possible; meet your immediate needs and plans for growth, but do not go beyond that; get a solution that is durable, easy to maintain and repairable.",
          when: "You should review your existing servers and related storage platforms now to make sure they meet the standards, and continue to meet these standards if you buy any new ones.",
        }),
        priority: "LOW" as const,
        govLink: link("servers-and-storage", "All servers and related storage platforms should be energy-efficient and set up to reduce power consumption, while still meeting user needs"),
      },
      {
        code: "server-physical-environment",
        title: "All server and related storage platforms should be kept and used in an appropriate physical environment",
        description:
          "In plain English: servers need a dedicated, locked room meeting legal size minimums (3.4m deep × 2.2m wide for one cabinet, bigger for more), no windows, no classroom access, no liquids, isolated UPS power, and proper cooling. Laptops and other battery devices can't be stored in there (fire risk).",
        sourceText: src({
          why: "Meeting this standard means servers and related storage platforms should be more secure, have a longer lifespan and be less vulnerable to service failure.\n\nNot meeting this standard increases the risk of: losing access to critical data; the servers or related storage platforms not working; failing to meet data protection legislation.",
          how: "Using cloud solutions reduces the need for local servers. Make sure that your servers and related storage platforms can only be accessed by people who have a genuine need to do so.",
          technical:
            "Make sure servers are in a dedicated, secure, locked room or cupboard that is not used for other purposes.\n\nThe room should meet the size requirements set by the Health and Safety Executive and British Standards: depth (for a 1000mm deep cabinet) 3.4m; width (for an 800mm wide cabinet) 2.2m. For each additional server cabinet, use the same minimum depth and increase the width by 0.8m, leaving 1.4m to the side wall.\n\nThe room or cupboard should also: have servers mounted or stored in cabinets; be free of flammable items such as paper, boxes, clothing, solvents or chemicals; have a dedicated, isolated uninterruptible power supply that can meet or exceed current demand; have sufficient cooling or mechanically assisted ventilation to keep server equipment within manufacturers' recommended temperature guidelines.\n\nThe room cannot: contain battery-powered end user devices, such as laptops, due to a potential fire risk; have any windows or be accessible directly from a classroom; store any liquids in it, such as bottles of water or hot drinks.\n\nOther potential threats to prevent: leaking pipework for water, heating, drainage, or vents; water sources in rooms above (for example, toilets or science labs); equipment such as water tanks, heating equipment or boilers; dust from building work.",
          when: "You should already be meeting this standard to help safeguard, protect and secure your data and systems. It is also a requirement for meeting data protection legislation.",
        }),
        guidance: "Server room minimum: 3.4m deep × 2.2m wide (one cabinet); no windows, no classroom access, no liquids.",
        priority: "HIGH" as const,
        govLink: link("servers-and-storage", "All server and related storage platforms should be kept and used in an appropriate physical environment"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 9. Cloud solutions (not a core standard)
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/cloud-solutions
  // -------------------------------------------------------------------
  {
    code: "cloud-solutions",
    title: "Cloud solutions",
    description:
      "Moving services to the cloud instead of running your own servers — done properly, with data protection, one login per user, and a real backup plan rather than just trusting the cloud provider.",
    officialUrl: `${GOV_BASE}/cloud-solutions`,
    items: [
      {
        code: "cloud-alternative-to-servers",
        title: "Use cloud solutions as an alternative to locally-hosted systems, including servers",
        description:
          "In plain English: before buying or renewing a local server, check whether a cloud service could do the job instead — it's usually cheaper, more resilient, and less work to maintain. Some things (door access control, cashless catering) may still need a local server.",
        sourceText: src({
          why: "Using cloud solutions reduces the need for local servers. This can: support your overall school strategy; allow you to take advantage of low-cost or free cloud services for some applications; save money by reducing onsite equipment and energy costs; improve safety and security by increasing resilience to cyber attacks; improve reliability and business continuity.\n\nIt can also save time by allowing users to work more flexibly and collaboratively, and by outsourcing hardware and software updating and maintenance.\n\nLocal servers may still be needed for some systems, such as access control (door security), building management, or cashless catering.",
          how: "Before moving to the cloud: understand the software, devices and data you currently use and what you use them for; consider the types of data you need to import and export easily from the cloud; ask your IT support about free cloud services your school can benefit from.\n\nAsk your IT support to set up your cloud solutions to meet the standards described in the technical requirements of this standard.",
          technical:
            "Cloud solutions need a level of security to be in place — follow the cyber security standards. You must have reliable broadband with the capacity to support your needs — follow the broadband internet standards.\n\nAsk your IT support to make sure that data used in the cloud solution is portable and allows for: secure encrypted transfer; data export to an open standard or commonly used format (for example, .CSV and/or .ODT); data links through secure, documented APIs; a timely process for data transfer in an open standard if you end the contract.",
          when: "You should meet this standard as soon as possible to realise the benefits.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("cloud-solutions", "Use cloud solutions as an alternative to locally-hosted systems, including servers"),
      },
      {
        code: "cloud-data-protection-legislation",
        title: "Cloud solutions must follow data protection legislation",
        description:
          "In plain English: any cloud service storing personal data needs a data protection impact assessment, a data sharing agreement that commits the provider to telling you promptly about a breach, and data should stay in the UK/EU unless you've checked the transfer is UK GDPR-compliant.",
        sourceText: src({
          why: "You must comply with data protection legislation.",
          how: "Responsible bodies must seek assurance from cloud solution and IT support providers that data is being handled legally. Your IT support should consult with your data protection officer (DPO) on data protection issues such as data retention and sharing.",
          technical:
            "Your DPO should carry out data protection impact assessments (DPIA) for any cloud solutions that store personal and/or sensitive personal data.\n\nAll systems need to follow the National Cyber Security Centre (NCSC) cloud security principles. Make sure: data processing carried out by third parties is covered by an appropriate contract; there is a user account creation, approval and removal process that complies with data protection legislation; there is a data sharing agreement with your cloud solution provider; roles and responsibilities for dealing with a data breach are clearly documented.\n\nYour data sharing agreement needs to state that the cloud solution provider will share information promptly if there is a data breach.\n\nData should be stored and processed in the UK or EU, unless you have confirmed that any international transfer of your data complies with UK GDPR.",
          when: "You should already be meeting this standard in accordance with data protection legislation.",
        }),
        priority: "HIGH" as const,
        govLink: link("cloud-solutions", "Cloud solutions must follow data protection legislation"),
      },
      {
        code: "cloud-id-access-management",
        title: "Cloud solutions should use ID and access management tools",
        description:
          "In plain English: one login per user across all your cloud services (single sign-on), rather than a different password for every tool — it's easier to secure, and easier to switch off access the moment someone leaves.",
        sourceText: src({
          why: "Many cloud solutions work independently from each other and need multiple logins and passwords. To meet your data protection and safeguarding obligations, you should use a central ID and access management tool. This will help to secure and safeguard data and increase cyber security by: providing one centrally managed account with one log in for each user; simplifying login organisation and management when users join or leave; managing access to systems based on groups so that the right people get access to the right tools.",
          how: "Ask your IT support to assess your existing or potential cloud solutions and work with them to choose an appropriate ID management system, used to secure all current and future cloud solutions and systems (including curriculum tools).",
          technical:
            "To meet this standard you should: test it with all systems and make sure this is the only way staff and students can log on; have agreed, documented processes in place to manage the addition and removal of users; create roles that make sure all types of users have the right levels of access to the right systems; make sure that your IT support has separate, secure access to your cloud solution, independent of the ID management system.",
          when: "You should meet this standard as soon as you can. It helps to keep your data and systems secure.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("cloud-solutions", "Cloud solutions should use ID and access management tools"),
      },
      {
        code: "cloud-availability-range-of-devices",
        title: "Cloud solutions should work on a range of devices and be available when needed",
        description:
          "In plain English: before signing up to a cloud service, trial it and check its advertised uptime (\"availability\") properly — the difference between 99% and 99.9% is the difference between about 7 hours and 45 minutes of downtime a month, which matters a lot.",
        sourceText: src({
          why: "Good access and availability will make it easy for users to work with the data using different systems, from anywhere and from a range of devices.\n\nPoor or unreliable availability of a cloud solution could have a significant impact on running your school or college.",
          how: "Before entering a cloud solutions agreement, make sure you understand how and when it will need to be accessed by users. When procuring cloud solutions make sure published availability targets meet your needs — you should trial the cloud solutions before committing to buy.\n\nAvailability targets provided by cloud suppliers may appear misleading. Cloud solutions run 24 hours a day and 7 days a week. This means that less than 1% difference in cloud availability can significantly affect downtime and performance: 99% availability = approximately 7 hours of downtime per month; 99.9% availability = approximately 45 minutes of downtime per month; 99.99% availability = approximately 5 minutes of downtime per month.",
          technical:
            "To meet this standard you should: make sure that you can easily access data from the cloud solution in a way which meets your and your users' needs; allow easy but secure access from a range of devices, and ask your cloud provider about secure access to their services.",
          when: "You should meet this standard for existing and new cloud solutions.",
        }),
        guidance: "99% uptime ≈ 7 hrs/month downtime; 99.9% ≈ 45 min; 99.99% ≈ 5 min.",
        priority: "LOW" as const,
        govLink: link("cloud-solutions", "Cloud solutions should work on a range of devices and be available when needed"),
      },
      {
        code: "cloud-data-backup",
        title: "Make sure that appropriate data backup provision is in place",
        description:
          "In plain English: don't assume your cloud provider backs up your data forever — some only keep backups for 30 days. Ask what they back up, where, for how long, and how often, and for anything critical, use the 3-2-1 rule (3 copies, 2 devices, 1 offsite) on top of what the provider gives you.",
        sourceText: src({
          why: "The most common risk of cloud data loss is accidental or deliberate data deletion by users. Although data loss by cloud providers is uncommon, it can happen.\n\nLoss of data can lead to a data breach and mean you need to inform the appropriate authorities. It may also obstruct or prevent critical business operations.\n\nCloud providers will only hold backup data for a limited period. This could be for as little as 30 days with some providers. This will depend on your service level agreement.",
          how: "Working with your DPO and IT support, make sure you understand your cloud provider's backup processes and policies. Ask: what data do they backup; where is it held (for UK GDPR compliance); how long is the data held for; how frequently are backups made.",
          technical:
            "To meet this standard you should identify the data backup provision you need for each solution, based on the data it will store — considering its sensitivity, its importance to normal operations, the impact if unavailable, how long you could be without it, and balancing cost against need.\n\nFor critical data use the 3-2-1 rule: at least 3 copies, on 2 devices and 1 offsite.\n\nThird party solutions and plug-ins are available for cloud solutions that do not meet your data backup needs.",
          when: "You should already be meeting this standard to help safeguard, protect and secure your data and systems. It is also a requirement for meeting data protection legislation.",
        }),
        guidance: "Cloud provider backups can be as short as 30 days — check your SLA.",
        priority: "HIGH" as const,
        govLink: link("cloud-solutions", "Make sure that appropriate data backup provision is in place"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 10. Digital accessibility (not a core standard)
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/digital-accessibility
  // -------------------------------------------------------------------
  {
    code: "digital-accessibility",
    title: "Digital accessibility",
    description:
      "Making sure the school's digital products, content and communications work for everyone — including students, staff, and parents with additional needs, disabilities, or English as an additional language.",
    officialUrl: `${GOV_BASE}/digital-accessibility`,
    items: [
      {
        code: "accessibility-in-strategies-policies",
        title: "Include digital accessibility in relevant strategies and policies",
        description:
          "In plain English: when you next review your digital technology strategy, curriculum policy or SEND policy, explicitly write in how you'll meet people's accessibility needs — don't leave it as an afterthought.",
        sourceText: src({
          why: "Schools and colleges should provide equity of access for as many people as possible.\n\nWhen digital accessibility is included in policies and strategies, this can help you: remove barriers to teaching and learning; make better buying decisions on technology; meet legal requirements on equality and access.",
          how: "Include accessible digital technology in your wider policies and strategies — these could be your digital technology strategy, curriculum policy, or SEND policy.\n\nWork with students, staff and parents to identify their digital accessibility needs. SLT should identify which strategies and policies you need to review and how you'll include digital accessibility in them, including: the accessibility needs of the school or college community; how you intend to meet these needs; how you'll make all communications and content, including your website, accessible.",
          when: "Digital accessibility should be actively addressed and included in your next policy and strategy review.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("digital-accessibility", "Include digital accessibility in relevant strategies and policies"),
      },
      {
        code: "hardware-software-accessibility-features",
        title: "Hardware and software should support the use of accessibility features",
        description:
          "In plain English: 1 in 5 people in the UK have a disability. The devices and software you already own likely have built-in accessibility features (text-to-speech, captions, zoom, translation) — make sure your security settings don't accidentally block them, and that staff know how to switch them on.",
        sourceText: src({
          why: "1 in 5 people have a disability in the UK, but accessibility applies to all. Students, staff, parents and carers needs will vary depending on their situation.\n\nDigital accessibility features are often included in existing devices and operating systems. These features should include: text-to-speech and dictation; caption settings; zoom and adjustment settings; translation and language tools.\n\nHardware and software used by students and staff should have these features available and support provided for those who use them.",
          how: "SLT should make sure new and existing hardware, software and digital services: are accessible or have accessibility features included; can provide equity of access; are set up to work with assistive technology and audio-visual equipment; remain safe and secure when accessibility features are enabled – accessibility features should not be blocked by generic security policies; consider accessibility needs when using IT in exams.\n\nTalk to your digital and content service suppliers if you have specific accessibility requirements. Ask them about their products and services accessibility statements.",
          when: "If your current hardware and software do not have these features, you will need to make sure they are included when you buy new equipment or services.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("digital-accessibility", "Hardware and software should support the use of accessibility features"),
      },
      {
        code: "accessible-communications",
        title: "Communications should be accessible to all",
        description:
          "In plain English: the school website and any communication to parents (emails, texts, letters) should be usable by people with additional needs, disabilities, or EAL — staff should know who to ask (SENCo, IT support, or the SLT digital lead) when something needs making accessible.",
        sourceText: src({
          why: "Making communications accessible can support students, staff, parents, and carers. It can assist those with additional needs like special educational needs, disabilities, and English as an additional language (EAL). It can help: parents and carers to support their children's learning; staff to meet student, parent and carer needs and concerns; support staff in their administration and teaching tasks.",
          how: "Websites should be accessible for everyone. Consider accessibility when commissioning or building a website. You could look at alternative formats for all communications, including email attachments, text messages and social media.\n\nMake sure that: there is understanding of accessibility and its importance throughout the school or college; staff are trained on accessibility and can write and access content in an accessible format; staff know who to contact to help them make things accessible – this may be the special educational needs coordinator (SENCo), IT support or the SLT digital lead.",
          when: "Once training is complete, communications and content should be accessible. When reviewing your strategies and policies, include how you will provide accessible communications for students, staff, parents and carers.",
        }),
        priority: "LOW" as const,
        govLink: link("digital-accessibility", "Communications should be accessible to all"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 11. IT support (not a core standard)
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/it-support
  // -------------------------------------------------------------------
  {
    code: "it-support",
    title: "IT support",
    description:
      "Whether it's in-house, outsourced, or a mix — your IT support needs to actually be commissioned, resourced and reviewed as a service, with clear response times and a yearly check that it's still fit for purpose.",
    officialUrl: `${GOV_BASE}/it-support`,
    items: [
      {
        code: "itsupport-meets-standards",
        title: "Make sure IT support helps you meet the digital and technology standards",
        description:
          "In plain English: your IT support's day-to-day work and planning decisions should be actively pointed at the 6 core DfE standards, not just general troubleshooting — and your digital strategy review should check progress against them.",
        sourceText: src({
          why: "The Department for Education's digital and technology standards help your school or college work towards and maintain safe and reliable technology infrastructure. Meeting the standards is a shared responsibility across your school or college. IT support contributes by making sure your technology and systems meet the necessary requirements.\n\nAll schools and colleges should be working towards meeting 6 core standards by 2030: Broadband internet; Cyber security; Digital leadership and governance; Filtering and monitoring; Network switching; Wireless network.",
          how: "IT support should make sure that their daily activities and planning decisions help you meet and stay compliant with the digital and technology standards.\n\nYour SLT digital lead should make sure the requirements of the standards inform your digital technology strategy and school development plan, working with IT support to identify any technical needs or risks.",
          when: "You should already be working towards meeting the digital and technology standards.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("it-support", "Make sure IT support helps you meet the digital and technology standards"),
      },
      {
        code: "itsupport-maintains-improves",
        title: "Make sure IT support actively maintains and improves your digital technology in line with your digital strategy",
        description:
          "In plain English: IT support's job isn't just fixing things when they break — it includes keeping asset registers up to date, applying security patches, maintaining backups and filtering/monitoring systems, and planning upgrades with the SLT digital lead.",
        sourceText: src({
          why: "Effective IT support should help you: meet statutory duties, including data protection regulations; understand what technology you have and how it's supported; keep your technology working reliably, even at busy times; plan upgrades and improvements; support staff and students to use technology effectively in your school or college.",
          how: "Start by establishing what digital technology and services you currently have, based on your existing asset and contract registers and your digital technology strategy. Consider factors that affect your IT support needs, such as multiple sites or emergency cover.\n\nIT support should provide services to keep your technology working reliably and securely, including: monitoring and managing your network, devices and cloud services; maintaining your technology through security patching, firmware updates and health checks; supporting your SLT digital lead on disaster recovery and cyber response plans; making sure all critical data and systems are backed up and restorable; working with the DSL to keep filtering and monitoring systems effective; adding and removing user accounts; responding to and resolving day-to-day support requests.",
          technical:
            "IT support should work with your SLT digital lead to plan upgrades and identify where improvements are needed: identify when technology needs replacing; advise on the budget implications of upgrades or replacements; help to evaluate and implement new technology and software; stay up to date with developments in digital technology.",
          when: "To maintain your digital technology and help you plan improvements, you should already be meeting this standard or working towards it.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("it-support", "Make sure IT support actively maintains and improves your digital technology in line with your digital strategy"),
      },
      {
        code: "itsupport-responsive-service-expectations",
        title: "Make sure your IT support is responsive and meets agreed service expectations",
        description:
          "In plain English: agree (and write down) how quickly IT support should respond to and resolve issues, how requests are prioritised, and how serious incidents get escalated. Every request should be logged and tracked — not handled through informal messages that go unrecorded.",
        sourceText: src({
          why: "Reliable and responsive IT support helps to keep your school or college running smoothly. It minimises disruption to learning if problems occur, protects sensitive data and gives staff and students confidence when using digital technology.\n\nSetting clear expectations for IT support's responsiveness helps you evaluate IT support's effectiveness, plan for the future and make sure you have enough capacity for times of high demand, such as exam periods or the start of the academic year.",
          how: "Your SLT digital lead should work with IT support to set and record clear expectations for how quickly issues will be responded to and resolved, how support requests will be prioritised, and how complex issues or serious incidents will be escalated.\n\nIT support should include multiple ways to raise requests (phone, email, in person), clear operating hours, and self-service options for common issues. Staff should avoid making support requests through unofficial channels, such as instant messages, since these can easily go unrecorded.",
          technical:
            "Make sure all IT support requests are recorded and tracked until they are resolved. For each request, you should record: a description of the issue; the date and time the request was made; the requester's name and the approver if required; the issue's priority level; actions taken to investigate and resolve the issue.\n\nConsider using a case management or helpdesk system to record and track requests.",
          when: "You should already be meeting this standard or working towards it.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("it-support", "Make sure your IT support is responsive and meets agreed service expectations"),
      },
      {
        code: "itsupport-annual-review",
        title: "Review your IT support at least once a year",
        description:
          "In plain English: once a year, check what IT support you have, whether it's performing, and whether it's good value — not just the cheapest option, but one that's reliable during busy periods and fits your budget. Report the findings to SLT, the business manager, and governors.",
        sourceText: src({
          why: "This annual review is an important part of your school or college's digital strategy review. Reviewing your IT support arrangements each year will help you to: assess how well IT support helps you meet the digital and technology standards; check your IT support meets your needs and supports your digital strategy; make sure IT support has the right skills and capacity; confirm that IT support offers value for money; plan upgrades and improvements; give leaders evidence to make informed decisions about contracts and investment.",
          how: "Your SLT digital lead should lead a formal review at least once a year, checking: the type of IT support you have and how well it supports your digital strategy; new or upcoming needs; whether IT support has the right skills and capacity; whether resources and budget are sufficient.\n\nUse your IT support request records and any user feedback to assess performance. Your review should also include contracts for any external IT support, whether procurement stayed within budget, and whether the support offers good value for money — value for money does not necessarily mean the lowest cost.",
          when: "Carry out this review each year alongside your school or college's wider digital strategy review.",
        }),
        priority: "LOW" as const,
        govLink: link("it-support", "Review your IT support at least once a year"),
      },
      {
        code: "itsupport-staff-training-guidance",
        title: "Make sure staff get clear guidance and training on using technology",
        description:
          "In plain English: every new staff member gets induction training on the key systems (MIS, safeguarding platforms, parental comms) plus annual refreshers and cyber security awareness training, and there's clear, plain-English written guidance for common tasks like logging in or resetting a password.",
        sourceText: src({
          why: "Training staff to use technology safely, securely and effectively helps them make better use of it to support teaching, learning and school management.\n\nHaving clear documentation and guidance supports training, reduces reliance on IT support for simple queries, and helps staff use technology with confidence.\n\nWithout adequate training and guidance materials, technology may be underused or misused. Inadequate training or guidance can also create safeguarding and data protection risks.",
          how: "All new staff should receive induction training when they join or change roles, followed by regular refresher training, covering essential systems like your management information system (MIS), safeguarding and behaviour platforms and parental communication tools, as well as the cyber security awareness training set out in the cyber security standards.\n\nIT support should develop clear and accessible written guidance for common systems and procedures — such as logging in, resetting passwords, solving common problems, raising support requests — written in plain English and published somewhere easily accessible, such as your intranet.",
          technical:
            "IT support should maintain technical documentation for your systems and network to support your business continuity and disaster recovery plans, and should help your SLT digital lead develop and maintain technology-related policies, such as those on data protection, cyber security and acceptable use.",
          when: "You should already have training and guidance in place. Review them regularly to reflect new technology and other changing needs.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("it-support", "Make sure staff get clear guidance and training on using technology"),
      },
    ],
  },

  // -------------------------------------------------------------------
  // 12. Laptops, desktops and tablets (not a core standard)
  // https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/laptops-desktops-and-tablets
  // -------------------------------------------------------------------
  {
    code: "devices",
    title: "Laptops, desktops and tablets",
    description:
      "The devices students and staff actually use day-to-day: picked to fit real teaching needs, locked down and safe, meeting DfE's minimum spec table, and bought/disposed of responsibly.",
    officialUrl: `${GOV_BASE}/laptops-desktops-and-tablets`,
    items: [
      {
        code: "devices-meet-educational-needs",
        title: "Devices should meet educational needs and support the digital technology strategy",
        description:
          "In plain English: don't buy devices because they're cheap or because of a sales pitch — follow a 3-step process: have a digital technology strategy, work out what students/staff actually need devices for, then assess the security/technical requirements before deciding to buy new or repurpose what you have.",
        sourceText: src({
          why: "Providing devices that meet educational needs and support the digital technology strategy will help: curriculum planning and delivery; administration, including data and financial management; flexible and cross-site working.\n\nDevices that are not suitable may: lead to lost learning or disrupt day to day operations; not be safe and secure; need to be repaired and replaced more often; cost more in the long run.",
          how: "To meet this standard, the SLT should follow this 3-step process:\n\n1. Create a digital technology strategy (see digital leadership and governance standards).\n2. Identify the device needs of students and staff — the SLT digital lead should assess how devices will support needs, looking at who uses them, where they are kept and what they're used for, to identify the number and type of devices needed, physical requirements, technical support level, and training requirements.\n3. Assess the security and technical requirements of the devices — the SLT digital lead should work with IT support to determine whether to buy new devices or repurpose existing ones.",
          when: "This standard should be met when the SLT review the use of laptops, desktops and tablets, or buy new devices.",
        }),
        priority: "MEDIUM" as const,
        govLink: link("laptops-desktops-and-tablets", "Devices should meet educational needs and support the digital technology strategy"),
      },
      {
        code: "devices-safe-secure",
        title: "Devices should be safe and secure",
        description:
          "In plain English: every device needs a firewall, VLANs, managed anti-virus, an enterprise/education-grade OS with security patches, and to meet the KCSIE filtering/monitoring rules — and should be centrally managed so IT support can remotely lock or wipe a lost or stolen one.",
        sourceText: src({
          why: "Keeping devices safe and secure will protect those who use them, the network and the data on them. This will: make it easier to apply security and safeguarding policies to each device; minimise the risk of cyber security incidents and data breaches.\n\nThe risks of not doing this include: students accessing harmful or inappropriate material; lost learning due to cyber incidents or data breaches; difficulty managing safeguarding; loss of public confidence and reputational damage.",
          how: "IT support should work with the designated safeguarding lead to check and confirm all devices meet the Keeping children safe in education (KCSIE) requirements for information security and access management, and filtering and monitoring. All new devices must be compatible with existing filtering, monitoring and security systems.",
          technical:
            "IT support should check all devices are configured securely: with a protective firewall on the network or device; using VLANs which add separate layers of protection; with managed anti-virus and anti-malware software; with enterprise or education-grade operating systems, including support and up-to-date security patches; with labels or tags recorded in an asset register; with accessibility features that are not blocked by security policies.\n\nDevices should be centrally managed by IT support, including applying security patches, recording up-to-date asset information, and restricting/monitoring browser access. Mobile and portable devices should have mobile device management so IT support can remotely lock or wipe them and secure apps and software.\n\nThe data protection officer should support a data protection impact assessment (DPIA) for all existing devices and whenever new ones are bought, assessing the risk to personal/sensitive data, of taking devices offsite, and of bring-your-own-device strategies.",
          when: "This standard should be met now for all laptops, desktops and tablets currently used.",
        }),
        priority: "HIGH" as const,
        govLink: link("laptops-desktops-and-tablets", "Devices should be safe and secure"),
      },
      {
        code: "devices-minimum-requirements",
        title: "Devices should meet or exceed the minimum requirements",
        description:
          "In plain English — the actual minimum spec table DfE publishes: enterprise/education-grade OS; 5 years of security patches for laptops/desktops (3 years for tablets); 3-year warranty for laptops/desktops (2 years for tablets); Wi-Fi 802.11ac Wave 2 minimum (Wi-Fi 6 recommended); tablets need at least a 9.7-inch screen. Anything failing the OS requirement should be replaced now.",
        sourceText: src({
          why: "Devices should be assessed against the needs of students and staff. All devices should also meet or exceed the minimum requirements set out in this standard. This will make sure devices are safe and secure, and stable and reliable.\n\nNot meeting these requirements could mean your devices: negatively impact teaching and learning; are at risk of malware, ransomware and potential data breaches; are not value for money.",
          how: "IT support should review the minimum requirements set out in this standard. Devices should also be reviewed once a year to take account of any changes to the minimum requirements.",
          technical:
            "Minimum requirements table:\n\n- Operating system: enterprise or education-grade operating systems, designed for professional rather than home use.\n- Support and security: tablets — 3 years of manufacturer support and security patches; laptops and desktops — 5 years of support and security patches.\n- Warranty length: 3 years for laptops and desktops; 2 years for tablets.\n- Wirelessly connecting to the IT network (for portable devices): devices should support the wifi standard 802.11ac Wave 2, but it's recommended that devices meet wifi 6 (802.11ax).\n- Screen size (for tablets only): 9.7 inches.",
          when: "Laptops, desktops and tablets should be replaced or upgraded now if they do not meet the operating system requirements of this standard. For everything else, check whether they can be upgraded or repurposed before choosing to buy any new devices, and make sure this standard is met when investing in new devices.",
        }),
        guidance: "Laptops/desktops: 5-yr security support, 3-yr warranty. Tablets: 3-yr support, 2-yr warranty, 9.7\" min screen. Wi-Fi: 802.11ac Wave 2 min.",
        priority: "HIGH" as const,
        govLink: link("laptops-desktops-and-tablets", "Devices should meet or exceed the minimum requirements"),
      },
      {
        code: "devices-energy-sustainable-disposal",
        title: "Make sure devices are energy efficient, and they are bought and disposed of sustainably",
        description:
          "In plain English: switch off devices when not in use, buy Energy Star-rated devices where possible, and when disposing of old ones, follow WEEE regulations and get certificates proving data was securely destroyed and the waste handled legally.",
        sourceText: src({
          why: "Devices can be one of the biggest sources of energy use in schools and colleges. Taking an energy efficient approach to the buying, setting up, using and disposal of devices will help with cost savings and sustainability.\n\nIf this standard is not met, there is a risk of: increased costs by using more energy than you need; creating unnecessary waste; it negatively impacting the environment.",
          how: "The SLT digital lead should review the use of both existing and new devices. For existing devices make sure they are switched off when not in use, automatically power off when they do not need to be used out of hours, and are only using the tools needed.\n\nWhen buying new devices check whether existing ones can be repurposed, and whether they are rated with a low energy certification, such as Energy Star.",
          technical:
            "When disposing of devices, IT support should make sure that: Waste Electrical and Electronic Equipment (WEEE) regulations and data protection requirements are met; they have certificates for WEEE, disposal and destruction of data; the IT asset register is updated; action is taken to prevent security incidents by removing or destroying any data on the devices.",
          when: "The WEEE regulations are a legal requirement. The SLT should consider energy efficiency the next time they invest in new devices. They should also review how existing devices are used.",
        }),
        guidance: "WEEE regulations are a legal requirement at disposal.",
        priority: "LOW" as const,
        govLink: link("laptops-desktops-and-tablets", "Make sure devices are energy efficient, and they are bought and disposed of sustainably"),
      },
    ],
  },
];
