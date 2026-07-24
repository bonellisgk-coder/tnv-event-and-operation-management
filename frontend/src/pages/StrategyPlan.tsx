import React, { useState } from 'react';
import { 
  Compass, 
  ShieldCheck, 
  Target, 
  Users, 
  Layers, 
  MapPin, 
  BookOpen, 
  Heart, 
  Award, 
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileText,
  Search
} from 'lucide-react';

interface MonthActivity {
  month: number;
  activityName: string;
  description: string;
  execution: string;
  impact: string;
}

interface DepartmentPlan {
  id: string;
  name: string;
  category: 'MANAGEMENT' | 'OPERATIONS';
  icon: string;
  tagline: string;
  purpose: string;
  needInSociety: string;
  roles: string[];
  outcomes: string[];
  roadmap: MonthActivity[];
}

const DEPARTMENTS_DATA: DepartmentPlan[] = [
  // --- MANAGEMENT WINGS ---
  {
    id: 'chairperson',
    name: 'Chairperson / Chief Coordinator',
    category: 'MANAGEMENT',
    icon: '👑',
    tagline: 'Strategic nerve-centre and policy leadership',
    purpose: 'Provides strategic direction, policy framework, vision, and high-level state alignment across all departments.',
    needInSociety: 'Unifies statewide volunteer movement, bridges public needs with government systems, and leads crisis response.',
    roles: [
      'Setting organization mission, vision, and long-term roadmap.',
      'Supervising state-level strategies and high-impact interventions.',
      'Leading discussions with government and CSR partners.',
      'Reviewing performance across Management & Operations.'
    ],
    outcomes: [
      'Unified statewide strategy across 8 zones.',
      'High-level government & institutional alignment.',
      'Structured policy guidelines & annual impact report.'
    ],
    roadmap: [
      { month: 1, activityName: 'State Vision & Roadmap Declaration', description: 'Launch 6-month direction, targets, values, and reporting structure.', execution: 'Conduct hybrid meet with department and zone heads; share PDF roadmap.', impact: 'Clear alignment and smooth functioning across all teams.' },
      { month: 2, activityName: 'Government & Institutional Roundtable', description: 'Establish working relationships with Govt wings and NGOs.', execution: 'Host meet with 10-20 key stakeholders; discuss collaborative areas.', impact: 'Increased support, faster approvals, and wider execution power.' },
      { month: 3, activityName: 'Quarter Review & Evaluation', description: 'Review Q1 progress across all departments and address gaps.', execution: 'Collect reports, review meets, update timelines.', impact: 'Accountability and timely course correction.' },
      { month: 4, activityName: 'Flagship Statewide Campaign Launch', description: 'Introduce common campaign (Drug-Free / Hygiene / Tribal).', execution: 'Provide campaign kit and set zone targets.', impact: 'High volunteer mobilization and statewide recognition.' },
      { month: 5, activityName: 'Zone & Leader Recognition', description: 'Celebrate top-performing zones and department heads.', execution: 'Publish leaderboard and issue digital certificates.', impact: 'Motivates volunteers and improves productivity.' },
      { month: 6, activityName: 'State Leadership Conclave & Impact Report', description: 'Summarize achievements, release annual impact report.', execution: 'Hybrid summit with presentations and policy updates.', impact: 'Structured documentation and future-ready roadmap.' }
    ]
  },
  {
    id: 'ceo',
    name: 'CEO / Operational Leadership',
    category: 'MANAGEMENT',
    icon: '⚡',
    tagline: 'Operational backbone and day-to-day execution',
    purpose: 'Ensures smooth day-to-day operations, program execution, volunteer coordination, and system compliance.',
    needInSociety: 'Turns strategic plans into measurable, ground-level impact across all districts.',
    roles: [
      'Leading all operational teams and monitoring department performance.',
      'Ensuring compliance, documentation, and reporting at state/district levels.',
      'Maintaining communication between Chairperson Office, managers, and zone heads.',
      'Ensuring safe, ethical, and impactful volunteer activities.'
    ],
    outcomes: [
      'Standardized operational SOPs across all 8 zones.',
      'Timely task execution and high volunteer discipline.',
      'Data-driven operational blueprint for continuous scaling.'
    ],
    roadmap: [
      { month: 1, activityName: 'Statewide Workflow Setup & Delegation', description: 'Establish operational workflow and reporting lines.', execution: 'Draft operational SOPs and assign weekly reporting structure.', impact: 'Clarity in duties and increased accountability.' },
      { month: 2, activityName: 'Monthly Activity Calendar & Compliance Check', description: 'Standardize 30-day implementation in every district.', execution: 'Release 30-day task chart and review progress every 7 days.', impact: 'Uniform program execution and reduced delays.' },
      { month: 3, activityName: 'Volunteer Workflow & Quality Audit', description: 'Review on-ground execution, safety, and discipline.', execution: 'Collect zone audit reports and update safety guidelines.', impact: 'Improved field quality and better impact outcomes.' },
      { month: 4, activityName: 'All-Department Alignment Review', description: 'Structured meeting to align all managers with timelines.', execution: 'Each manager presents status; resolve bottlenecks.', impact: 'Eliminates miscommunication and enhances synergy.' },
      { month: 5, activityName: 'Volunteer Skill Training Rollout', description: 'Statewide training to improve professionalism.', execution: 'Create training modules and conduct zone-level sessions.', impact: 'Skilled volunteer force and improved output.' },
      { month: 6, activityName: 'Impact Analysis & Operational Blueprint', description: 'Final 6-month performance assessment.', execution: 'Compile reports and release next-cycle operational blueprint.', impact: 'Data-driven planning and faster growth.' }
    ]
  },

  // --- OPERATIONS DEPARTMENTS ---
  {
    id: 'disaster-response',
    name: 'Disaster Response & Emergency Management',
    category: 'OPERATIONS',
    icon: '🚨',
    tagline: 'Emergency crisis response, rescue, and community resilience',
    purpose: 'Equips communities with lifesaving knowledge, early warnings, first-aid, and rapid response during crises.',
    needInSociety: 'Safeguards lives during floods, cyclones, heatwaves, landslides, and public health emergencies.',
    roles: [
      'Building disaster-ready communities through risk mapping and drills.',
      'Training volunteers in CPR, first-aid, evacuation, and fire safety.',
      'Connecting volunteer networks with government disaster response bodies.',
      'Managing rapid relief distribution during monsoons and disasters.'
    ],
    outcomes: [
      'Disaster-ready villages, schools, and urban zones.',
      'Trained first-responder volunteer units across all 8 zones.',
      'Faster evacuation and minimized loss of life/property.'
    ],
    roadmap: [
      { month: 1, activityName: 'Community Risk Mapping & Vulnerability Survey', description: 'Identify high-risk zones for floods, fires, and accidents.', execution: 'Volunteers conduct surveys and map risk hotspots.', impact: 'Clear understanding of community risks for targeted intervention.' },
      { month: 2, activityName: 'Early Warning & Disaster Awareness Drive', description: 'Educate communities on alerts and emergency plans.', execution: 'Posters, social media, school sessions, and alert interpretations.', impact: 'Increases readiness and reduces panic during emergencies.' },
      { month: 3, activityName: 'Basic First-Aid & CPR Training', description: 'Train volunteers and youth in emergency medical support.', execution: 'Partner with Red Cross and Fire Department for practical drills.', impact: 'Creates skilled first responders who save lives before ambulances arrive.' },
      { month: 4, activityName: 'Fire Safety & Evacuation Simulation', description: 'Practical fire safety demonstrations and drills.', execution: 'Simulations in schools and public spaces with Fire & Rescue services.', impact: 'Reduced fire injuries and rapid response readiness.' },
      { month: 5, activityName: 'Flood & Cyclone Preparedness Drive', description: 'Door-to-door awareness on emergency kits and safe shelters.', execution: 'Distribute checklists and form community flood response teams.', impact: 'Families remain safe and prepared during monsoons.' },
      { month: 6, activityName: 'Community Mock Drill Simulation', description: 'Full-scale simulation of disaster scenarios.', execution: 'Coordinate with local authorities; volunteers execute response roles.', impact: 'Tests real-life operational readiness and identifies gaps.' }
    ]
  },
  {
    id: 'food-rescue',
    name: 'Food & Rescue',
    category: 'OPERATIONS',
    icon: '🍲',
    tagline: 'Emergency hunger relief and nutrition distribution',
    purpose: 'Eliminates hunger during emergencies, prevents food insecurity, and ensures no family is left without meals.',
    needInSociety: 'Protects vulnerable families, elderly, and disaster victims from starvation and malnutrition.',
    roles: [
      'Establishing rapid-response hunger relief and community kitchens.',
      'Distributing essential grocery kits and clean drinking water.',
      'Partnering with hotels/events to reallocate surplus food.',
      'Building ward and village-level rapid food distribution networks.'
    ],
    outcomes: [
      'Zero hunger zones in targeted communities.',
      'Rapid meal supply capability during floods/crises.',
      'Reduced food waste through community reallocation.'
    ],
    roadmap: [
      { month: 1, activityName: 'Community Hunger & Vulnerability Mapping', description: 'Identify households facing chronic food insecurity.', execution: 'Door-to-door surveys and mapping hunger hotspots.', impact: 'Accurate targeting of vulnerable families.' },
      { month: 2, activityName: 'Monthly Grocery Kit Distribution', description: 'Provide essential food kits to identified families.', execution: 'Community drives and volunteer home deliveries.', impact: 'Immediate relief from hunger and malnutrition.' },
      { month: 3, activityName: 'Community Kitchen Setup (Pilot)', description: 'Establish mobile or temporary kitchens for cooked meals.', execution: 'Set up kitchens in community halls or vans.', impact: 'Provides hot meals during emergencies and crises.' },
      { month: 4, activityName: 'No Food Waste Reallocation Initiative', description: 'Collect surplus food from events/hotels and redistribute.', execution: 'Partner with venues and ensure safe hygienic packaging.', impact: 'Reduces food waste and feeds low-income families.' },
      { month: 5, activityName: 'Volunteer Rapid Distribution Network', description: 'Build street and village-level volunteer meal distribution teams.', execution: 'Conduct mock drills and assign local coordination leads.', impact: 'Enables large-scale food distribution within hours of a crisis.' },
      { month: 6, activityName: 'Mobile Kitchen Expansion & Review', description: 'Evaluate 6-month hunger relief operations.', execution: 'Scale up mobile vans with donor and local body support.', impact: 'Sustained daily meal access for vulnerable groups.' }
    ]
  },
  {
    id: 'blood-donation',
    name: 'Blood Donation',
    category: 'OPERATIONS',
    icon: '🩸',
    tagline: 'Voluntary blood donor network and emergency supply support',
    purpose: 'Ensures safe, timely, and adequate blood supply for critical patients, emergency accident cases, and surgeries.',
    needInSociety: 'Eliminates blood shortages, removes misconceptions about donation, and saves lives through rapid response.',
    roles: [
      'Maintaining an updated state-level digital blood donor registry.',
      'Organizing mass donation camps in colleges, corporates, and villages.',
      'Managing emergency 24/7 blood request hotlines with hospitals.',
      'Educating public on plasma, platelet, and stem cell donation.'
    ],
    outcomes: [
      'Zero mortality caused by blood unavailability.',
      'Rapid donor dispatch within 30 minutes of emergency requests.',
      'Increased regular voluntary blood donor base across all districts.'
    ],
    roadmap: [
      { month: 1, activityName: 'Donor Mapping & Blood Group Camp', description: 'Identify donors and map blood groups in villages/colleges.', execution: 'Conduct camps with hospital support and create digital records.', impact: 'Builds strong emergency donor database.' },
      { month: 2, activityName: 'District-Wide Mass Blood Donation Drive', description: 'Organize large-scale voluntary donation event.', execution: 'Partner with licensed blood banks and Red Cross.', impact: 'Boosts blood bank reserves immediately.' },
      { month: 3, activityName: 'Hospital Partnership & Emergency Request Protocol', description: 'Establish 24/7 hotline system for emergency needs.', execution: 'WhatsApp hotline and quick-response volunteer teams.', impact: 'Reduces waiting time for critical patients.' },
      { month: 4, activityName: 'Quarterly Mega Blood Drive & Plasma Awareness', description: 'Conduct corporate and campus mega donation camps.', execution: 'Expert talks, pamphlets, and specialized donor registration.', impact: 'Ensures steady supply for surgeries and chronic care.' },
      { month: 5, activityName: 'Mobile Donation Van Initiative', description: 'Launch mobile blood collection unit for rural access.', execution: 'Work with district health authorities and blood banks.', impact: 'Reaches remote donors and expands donor pool.' },
      { month: 6, activityName: 'Emergency Mock Response & Donor Recognition', description: 'Simulate emergency blood dispatch scenario.', execution: 'Test response time and host donor appreciation ceremony.', impact: 'Strengthens network speed and encourages repeat donors.' }
    ]
  },
  {
    id: 'education',
    name: 'Education Empowerment Initiative',
    category: 'OPERATIONS',
    icon: '📚',
    tagline: 'Equal learning access, digital literacy, and academic mentoring',
    purpose: 'Strengthens foundational learning, reduces school dropout rates, and provides digital education to underserved students.',
    needInSociety: 'Bridges educational inequality for rural and low-income students in Tamil Nadu.',
    roles: [
      'Conducting foundational literacy and numeracy support camps.',
      'Providing spoken English, digital skills, and study workshops.',
      'Offering career guidance and scholarship awareness sessions.',
      'Enhancing school infrastructure through volunteer drives.'
    ],
    outcomes: [
      'Higher literacy, numeracy, and board exam pass rates.',
      'Reduced school absenteeism and dropouts.',
      'Digital literacy and career clarity for rural students.'
    ],
    roadmap: [
      { month: 1, activityName: 'Foundational Literacy & Numeracy Camp', description: 'Special learning sessions for students struggling in reading and math.', execution: 'Volunteers conduct 1-hour sessions using activity-based kits.', impact: 'Improved basic learning levels and reduced academic fear.' },
      { month: 2, activityName: 'Digital Learning Access Program', description: 'Introduce students to digital tools and mobile learning apps.', execution: 'Use volunteer devices or school ICT labs for e-content training.', impact: 'Bridges digital divide and boosts self-learning.' },
      { month: 3, activityName: 'Spoken English & Communication Workshop', description: 'Confidence-building activities focused on vocabulary and speaking.', execution: 'Role-plays, storytelling, and conversation circles.', impact: 'Improved communication skills and interview readiness.' },
      { month: 4, activityName: 'Exam Preparation & Study Skills Workshop', description: 'Teach time management, memory strategies, and revision.', execution: 'Practical demonstrations and take-home planners.', impact: 'Higher exam confidence and reduced stress.' },
      { month: 5, activityName: 'Science, Arts & Innovation Expo', description: 'Platform for students to display models and creative projects.', execution: 'Volunteers assist in preparing exhibits; invite parents.', impact: 'Encourages creativity and strengthens community-school bonds.' },
      { month: 6, activityName: 'Year-End Evaluation & Student Recognition Day', description: 'Assess learning progress and publicly honor top achievers.', execution: 'Simple tests, appreciation cards, and parent interactions.', impact: 'Measurable outcomes and sustained student motivation.' }
    ]
  },
  {
    id: 'environment',
    name: 'Environment Protection',
    category: 'OPERATIONS',
    icon: '🌱',
    tagline: 'Preserving ecosystems, pollution control, and climate action',
    purpose: 'Preserves natural resources, promotes plastic-free communities, and increases green cover across Tamil Nadu.',
    needInSociety: 'Combats pollution, deforestation, wetland degradation, and extreme climate events.',
    roles: [
      'Conducting tree plantation and sapling adoption drives.',
      'Restoring water bodies, lakes, ponds, and canals.',
      'Promoting solid waste segregation and plastic-free markets.',
      'Educating public on vehicle emissions and clean air.'
    ],
    outcomes: [
      'Increased urban/rural green cover and tree survival.',
      'Cleaned water bodies and reduced plastic dumping.',
      'Enhanced climate resilience in local communities.'
    ],
    roadmap: [
      { month: 1, activityName: 'Environmental Risk & Pollution Mapping', description: 'Identify pollution-prone areas and dumping hotspots.', execution: 'GPS mapping, community surveys, and source documentation.', impact: 'Clear baseline data for targeted eco-interventions.' },
      { month: 2, activityName: 'Plastic-Free Community & Segregation Drive', description: 'Promote waste segregation at source and alternative bags.', execution: 'Cloth bag distribution, vendor engagement, and green bins.', impact: 'Reduced landfill waste and cleaner public spaces.' },
      { month: 3, activityName: 'Tree Plantation & Green Cover Expansion', description: 'Increase native tree cover in schools and public lands.', execution: 'Plantation drives, sapling distribution, and volunteer adoption.', impact: 'Improved air quality and urban green cover.' },
      { month: 4, activityName: 'Water Body Cleaning & Protection Drive', description: 'Clean lakes, ponds, and canals with local bodies.', execution: 'Community clean-up weekend drives and waste removal.', impact: 'Restoration of aquatic ecosystems and water storage.' },
      { month: 5, activityName: 'Climate Change & Heatwave Preparedness', description: 'Educate public on heatwave safety and green living.', execution: 'Cooling measures, hydration points, and household pledges.', impact: 'Increased community resilience to extreme weather.' },
      { month: 6, activityName: 'Clean-Up Marathon & Eco Impact Review', description: 'Multi-location clean-up simulation and annual review.', execution: 'Data compilation, stakeholder meetings, and future planning.', impact: 'Long-term sustainability of environmental programs.' }
    ]
  }
];

const ZONES_LIST = [
  { name: 'Chennai Hub', location: 'Northern Coastal', districts: 'Chennai, Thiruvallur, Kanchipuram, Chengalpattu' },
  { name: 'Vellore Hub', location: 'Northern Interior', districts: 'Vellore, Ranipet, Tirupattur, Thiruvannamalai' },
  { name: 'Madurai Hub', location: 'Southern Hub', districts: 'Madurai, Dindigul, Theni, Virudhunagar, Ramanathapuram' },
  { name: 'Trichy Hub', location: 'Delta & Central', districts: 'Tiruchirappalli, Karur, Perambalur, Ariyalur, Pudukkottai' },
  { name: 'Coimbatore Hub', location: 'Western Belt', districts: 'Coimbatore, Tiruppur, Erode, Nilgiris' },
  { name: 'Tirunelveli Hub', location: 'Deep South', districts: 'Tirunelveli, Tenkasi, Thoothukudi, Kanniyakumari' },
  { name: 'Thanjavur Hub', location: 'Delta Zone', districts: 'Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai' },
  { name: 'Dharmapuri Hub', location: 'North-Western', districts: 'Dharmapuri, Krishnagiri, Salem, Namakkal' }
];

export const StrategyPlan: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'OPERATIONS' | 'MANAGEMENT'>('OPERATIONS');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('disaster-response');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepts = DEPARTMENTS_DATA.filter(d => 
    d.category === activeCategory && 
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.tagline.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedDept = DEPARTMENTS_DATA.find(d => d.id === selectedDeptId) || DEPARTMENTS_DATA[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-8 translate-x-8">
          <Compass className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase tracking-widest px-3.5 py-1 rounded-full border border-white/20">
              Statewide Master Plan 2026 – 2027
            </span>
            <span className="bg-amber-400 text-emerald-950 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full">
              6-Month Roadmap
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight leading-tight">
            Tamil Nadu Volunteers Organization
          </h1>
          <p className="text-amber-300 font-medium text-lg italic">
            “Service Beyond Self. Impact Beyond Boundaries.”
          </p>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            A comprehensive citizen-driven strategy unifying 36 specialized departments across 8 regional hubs to empower communities, support government initiatives, and drive sustainable development in Tamil Nadu.
          </p>
        </div>

        {/* Core Values Quick Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/15 text-xs">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-amber-300" />
            <span><strong>Service</strong> (Community)</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span><strong>Integrity</strong> (Transparency)</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-300" />
            <span><strong>Inclusivity</strong> (Equal Access)</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-300" />
            <span><strong>Leadership</strong> (Youth Force)</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span><strong>Sustainability</strong> (Long-Term)</span>
          </div>
        </div>
      </div>

      {/* 8 Regional Zonal Hubs Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-gray-dark text-lg">8 Statewide Zonal Hubs</h2>
          </div>
          <span className="text-xs text-gray-medium">Operations Field Coordination</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ZONES_LIST.map((zone, idx) => (
            <div key={idx} className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-border transition-colors">
              <p className="font-bold text-sm text-primary">{zone.name}</p>
              <p className="text-[11px] font-semibold text-gray-medium">{zone.location}</p>
              <p className="text-[10px] text-gray-medium mt-1 truncate">{zone.districts}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Explorer Section */}
      <div className="space-y-6">
        {/* Category Switcher & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-border shadow-sm">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => { setActiveCategory('OPERATIONS'); setSelectedDeptId('disaster-response'); }}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'OPERATIONS'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-gray-medium hover:text-gray-dark'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Operations Departments (25 Field Wings)</span>
            </button>
            <button
              onClick={() => { setActiveCategory('MANAGEMENT'); setSelectedDeptId('chairperson'); }}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                activeCategory === 'MANAGEMENT'
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-gray-medium hover:text-gray-dark'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Management Team (11 Apex Wings)</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-medium" />
            <input
              type="text"
              placeholder="Search department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs sm:text-sm border border-gray-border focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Master Details Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Department List */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-border shadow-sm space-y-2 max-h-[700px] overflow-y-auto">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-medium px-2 pb-2 border-b border-gray-border">
              {activeCategory === 'OPERATIONS' ? 'Select Operations Field' : 'Select Management Wing'}
            </h3>

            {filteredDepts.length === 0 ? (
              <p className="text-xs text-gray-medium p-4 text-center">No matching departments found.</p>
            ) : (
              filteredDepts.map((dept) => {
                const isSelected = dept.id === selectedDept.id;
                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-emerald-50/80 border-primary text-primary-dark shadow-sm'
                        : 'border-transparent hover:bg-gray-50 text-gray-dark'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{dept.icon}</span>
                        <div>
                          <p className="font-bold text-sm leading-snug">{dept.name}</p>
                          <p className="text-xs text-gray-medium line-clamp-1">{dept.tagline}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-medium opacity-50'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Department Details & 6-Month Roadmap */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Info Box */}
            <div className="bg-white rounded-2xl p-6 border border-gray-border shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-gray-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedDept.icon}</span>
                  <div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      {selectedDept.category} WING
                    </span>
                    <h2 className="text-xl font-bold text-gray-dark mt-1">{selectedDept.name}</h2>
                    <p className="text-xs font-medium text-gray-medium">{selectedDept.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Purpose & Need */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                  <p className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Purpose of Department</p>
                  <p className="text-gray-dark leading-relaxed">{selectedDept.purpose}</p>
                </div>
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1">
                  <p className="font-bold text-teal-900 uppercase tracking-wider text-[10px]">Need in Society</p>
                  <p className="text-gray-dark leading-relaxed">{selectedDept.needInSociety}</p>
                </div>
              </div>

              {/* Roles & Expected Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-2">
                  <p className="font-bold text-gray-dark uppercase tracking-wider text-[10px]">Key Responsibilities</p>
                  <ul className="space-y-1.5">
                    {selectedDept.roles.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-gray-dark uppercase tracking-wider text-[10px]">Expected Strategic Outcomes</p>
                  <ul className="space-y-1.5">
                    {selectedDept.outcomes.map((o, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-medium">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 6-Month Detailed Execution Roadmap */}
            <div className="bg-white rounded-2xl p-6 border border-gray-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-gray-dark text-base">6-Month Activity Roadmap & Execution Plan</h3>
                </div>
                <span className="text-xs text-gray-medium font-medium">Year 2026 – 2027</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDept.roadmap.map((step) => (
                  <div key={step.month} className="p-4 rounded-xl border border-gray-border hover:border-primary/40 bg-gray-50/50 space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="bg-primary text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        MONTH {step.month}
                      </span>
                      <FileText className="w-3.5 h-3.5 text-gray-medium" />
                    </div>
                    <h4 className="font-bold text-sm text-gray-dark">{step.activityName}</h4>
                    <p className="text-xs text-gray-medium">{step.description}</p>
                    
                    <div className="pt-2 border-t border-gray-200/80 text-[11px] space-y-1">
                      <p><strong className="text-gray-dark">Execution:</strong> <span className="text-gray-medium">{step.execution}</span></p>
                      <p><strong className="text-primary-dark">Expected Impact:</strong> <span className="text-emerald-700 font-medium">{step.impact}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
