# Building Design Systems for Emerging Technology

**[Visual 1: Opening - Undefined space transforming into structured system through systematic thinking]**

## The Challenge: Creating Patterns Where None Exist

Design systems typically adapt existing patterns. When technology is so new that no patterns exist, a different approach is required: systematic infrastructure that's principle-based rather than prescriptive, flexible enough to evolve as technology matures, and strategic enough to enable teams working in ambiguous conditions.

This case study demonstrates how to build design systems for emerging technologies—from establishing foundational infrastructure to scaling across organizations.

**SPEAKER NOTES:**
*Google Project Starline. 3D video communication at natural human scale on 16-foot displays. No existing UX patterns for natural-scale interfaces. Built Google's first natural-scale design system. Product pivoted from Continuum (multi-user around table) to Constellation (hybrid immersive) mid-project. Then transitioned to Apple to scale mature systems serving 20+ teams and millions of visitors.*

---

## Approach: Establishing Systematic Infrastructure

**[Visual 2: Foundation-building progression - small systematic actions creating expanding structural foundation]**

### Phase 1: Build Credibility Through Quick Wins

Comprehensive infrastructure requires organizational trust. The most effective approach begins with targeted interventions that demonstrate systematic thinking solves real problems.

**Identifying friction points**  
Teams accumulate scattered assets—video footage, images, design elements—across disconnected folders. Finding specific assets manually consumes 15-20 minutes per search, compounding across dozens of daily queries.

**Implementing systematic solutions**  
Component-based libraries enable filtering by multiple attributes simultaneously. Simple to implement, immediate impact: hours saved weekly across teams. More importantly, tangible proof that systematic approaches solve real problems, establishing credibility for larger infrastructure investments.

**The principle:** Systems earn adoption through demonstrated usefulness, not organizational mandate.

**SPEAKER NOTES:**
*Week 1 at Google: Built Figma component system for video footage library. Hundreds of clips from production shoots, different camera angles/users. Turned 20-minute folder searches into 20-second selections. Built immediate credibility for larger systematic work.*

*At Apple: Different scale, same principle. Identified gaps where existing components didn't cover edge cases or documentation wasn't clear for new team members. Small targeted improvements proved understanding of ecosystem before proposing larger changes.*

*0→1: Prove value through solving immediate pain points*
*Scale: Identify friction in existing systems, improve strategically*

---

## Foundation: Principles Enable Adaptation

**[Visual 3: Modular grid system morphing between configurations while maintaining structural integrity]**

### Phase 2: Design for Flexibility

When technology evolves rapidly, rigid specifications break. Effective systems are built on principles and patterns that remain stable as implementations change.

**Core systematic elements:**

**Principle-based components**  
Logic that remains stable even as specific implementations evolve. Modular building blocks that compose in multiple configurations, not locked to predetermined screens.

**Structural foundation**  
Grid systems and spatial logic providing consistency without constraining necessary adaptation.

**Composition patterns**  
Clear rules for how components work together to build larger systems.

**Demonstrated resilience**  
Mid-project, product direction can shift entirely. Systems built on patterns adapt—the same components reconfigure to new requirements. Systems built on pixel-perfect specifications require complete rebuilding. This flexibility isn't theoretical; it's essential.

**Application across stages:**

**At 0→1:** Flexibility means surviving pivots as technology and product direction evolve rapidly.

**At scale:** Flexibility means serving diverse product teams with varying requirements without fragmenting the system.

**SPEAKER NOTES:**
*Built natural-scale design system from scratch at Google: Core components for spatial interfaces (video tiles existing in 3D space), 8-point grid system for unusual dimensions (standard grids didn't work), motion specifications for 3D interactions with no precedent, screen templates built from reusable components (not locked to specific screens).*

*Critical decision: Pattern-based, not prescriptive. Three months in, product direction shifted from Continuum to Constellation. Completely different scope. Pixel-perfect specs would have required starting over—months of work lost. Instead, system adapted: same components, same grid, same motion principles, just reconfigured. Pivoted in weeks, not months.*

*At Apple: Mature system, established principles, but flexibility still essential. Components must work across 20+ product teams with different contexts. Architecture uses principle-based variants, not one-off solutions. New requirements extend the system systematically.*

*Key insight: At 0→1, flexibility = surviving pivots. At scale, flexibility = serving diverse needs without fragmentation.*

---

## Implementation: Bridging Design and Engineering

**[Visual 4: Translation layer - design intent flowing through systematic specifications into technical implementation]**

### Phase 3: Enable Technical Execution

The gap between design intent and engineering implementation creates organizational bottlenecks. Systematic approaches bridge this gap through structured specifications, technical validation, and collaborative problem-solving.

**Structured specifications:**
- Precise measurements aligned with engineering workflows
- Motion guidelines with detailed timing curves and easing functions
- Interactive prototypes demonstrating complex behaviors that static screens cannot communicate

**Technical problem-solving:**  
When user research identifies issues, feasible solutions within technical constraints must be proposed. Ideal approaches may not be timeline-viable; alternative technical solutions using motion design tools can provide detailed specifications for rapid engineering implementation.

**Cross-functional validation:**  
Working prototypes can be built in under a week when specifications are clear and technically grounded, solving user-identified problems within real constraints.

**Application across stages:**

**At 0→1:** Enable novel technical implementations where no precedent exists.

**At scale:** Validate technical feasibility before requesting implementation across multiple teams. Code prototyping catches performance issues, accessibility edge cases, and responsive behavior problems early.

**SPEAKER NOTES:**
*Built all developer specs at Google using component system, structured by engineering workstreams. Not just visual mockups—precise measurements, motion specs with timing curves, interactive Figma prototypes for complex spatial behaviors.*

*Torso gap problem: User research repeatedly surfaced visual issue. Proper webcam framing looks fine on laptops, but at natural scale (life-sized on 16-foot display) creates awkward torso gap. AI-driven solution ideal but not timeline-feasible. Proposed shader-based alternative. Created detailed After Effects mockup showing exact effect behavior, broke down technical approach. Engineering built working UXE prototype in under a week from specs. Solved user research problem within technical constraints.*

*At Apple: Engineering collaboration is governance and validation at scale. Code prototyping in HTML/CSS validates components are technically feasible before asking 20+ teams to implement. Catches performance issues, accessibility edge cases, responsive behavior problems early.*

*Same skill—bridging design and engineering—different application. 0→1: enabling novel implementations. Scale: validating feasibility before broad adoption.*

---

## Enablement: Multiplying Team Capability

**[Visual 5: Network effect - single systematic tool creating exponentially expanding connections and outputs]**

### Phase 4: Enable Independent Execution

Effective systems enable teams to make confident decisions without constant design involvement. This requires proactive infrastructure that anticipates needs before they're requested.

**Research enablement:**  
User research often requires simulating interactions that don't exist yet. Standard prototyping tools fall short for novel technology. Real-time interaction simulation proves critical for accurate user perception testing.

Learning necessary prototyping tools and building working simulations enables successful studies with clear user preference data. Impact extends beyond immediate research: proves design approach feasibility, creates reusable prototyping patterns for future studies, demonstrates advanced tool capabilities to encourage broader team adoption.

**Stakeholder communication:**  
Organizations make decisions through presentations. When teams need to visualize complex spatial interfaces in presentation decks but no tool exists, proactive template creation becomes team standard. Product managers can create high-fidelity stakeholder presentations independently. Design doesn't become bottleneck for critical decisions.

**Systematic enablement:**
- Simple assets that save collective hours across teams
- Component libraries that free bandwidth from repetitive tasks  
- Documentation that teaches systematic thinking, not just component usage
- Governance processes that enable contribution without creating chaos

**The measurement:** Success is measured by how confidently teams work independently, not by meeting attendance.

**Application across stages:**

**At 0→1:** Create enabling tools that multiply small team capabilities.

**At scale:** Build documentation and governance enabling 20+ teams to contribute systematically.

**SPEAKER NOTES:**
*UX intern at Google studying spatially-located closed captions (appearing near speaker in 3D space vs. single feed like Meet). Real-time interaction critical for user perception—static mockups or video wouldn't work. She struggled to create accurate study materials.*

*Two actions: Reached out to AR team (they'd worked on similar spatially-located features for glasses—got their learnings). Taught myself ProtoPie in a week, built working closed caption component with real-time simulation. Study succeeded: 9 of 11 participants preferred bottom-centered spatial version. Clear user preference data informed product decisions. Impact beyond study: proved spatial approach feasibility, created reusable patterns, encouraged team ProtoPie adoption.*

*3D presentation template: At Google, decisions made via slide presentations. Team needed to visualize 3D interfaces in decks, but no tool existed. Starline renders 3D using 16 layered planes—standard screenshots didn't convey this. Built parallax After Effects template mimicking rendering accurately. Became team standard. PMs could create high-fidelity stakeholder demos independently. Design unblocked from becoming bottleneck.*

*Other examples: Transparent PNG device frame (5 minutes to create, hours saved collectively), asset libraries, screen templates from system components.*

*At Apple: Team multiplication through documentation and governance. Multi-audience documentation (designers need usage guidelines, developers need implementation specs, stakeholders need rationale). Each finds what they need without asking. Governance processes document how to propose components, how changes get reviewed. Enables contribution without chaos.*

*0→1: Creating enabling tools. Scale: Documentation and governance. Same principle: enable independent work.*

---

## Evolution: Adapting to Organizational Context

**[Visual 6: Two network structures - sparse/foundational vs. dense/mature - showing same underlying systematic principles]**

### Phase 5: Scale Across Organizational Stages

Design systems require different tactical approaches at different organizational stages, while maintaining the same core systematic thinking.

**Building foundational infrastructure (0→1):**
- Define patterns where no precedent exists
- Maintain flexibility as technology evolves
- Establish infrastructure from nothing
- Prove value through demonstrated impact

**Characteristics:**  
Small teams defining novel interaction paradigms. Creating motion guidelines for spatial behaviors with no reference points. Developing prototyping workflows for technology that doesn't have established tooling. Establishing engineering handoff processes in ambiguous environments.

**Work focuses on:** Creation and flexibility. Laying foundation, not maintaining infrastructure.

**Scaling mature systems:**
- Serve 20+ product teams with diverse needs
- Support millions of daily visitors where performance is critical
- Maintain consistency at massive scale
- Enable contribution through governance

**Characteristics:**  
Established ecosystems requiring architectural components that work across multiple products. Creating multi-audience documentation for designers, developers, stakeholders. Ensuring accessibility compliance (WCAG AA) through specialist collaboration. Code prototyping to validate technical feasibility before broad implementation.

**Work focuses on:** Governance and scalability. Maintaining consistency while enabling innovation.

**What remains constant:**
- Systematic thinking that adapts to organizational needs
- Cross-functional collaboration driving adoption
- Strategic focus on highest-leverage work
- Balance between craft and infrastructure
- Enabling independent team execution

**SPEAKER NOTES:**
*Transitioned from Google (0→1 emerging tech) to Apple (mature scale). Taught me systems require different approaches at different stages.*

*Google characteristics: No precedent, defining patterns from scratch. Flexibility essential as tech evolves. Small team establishing foundational infrastructure. Prove value through quick wins solving immediate problems. Built complete natural-scale design system from scratch. Created motion guidelines for spatial interactions with no precedent. Developed prototyping workflows for novel technology. Established engineering handoff processes. Built enabling tools multiplying team capability. Work about creation and flexibility—laying foundation.*

*Apple characteristics: Established ecosystem, 20+ product teams. Millions daily visitors—performance and accessibility critical. Consistency at scale primary challenge. Governance and documentation enable contribution. Architecting core components for apple.com design system. Multi-audience documentation. WCAG AA accessibility compliance through specialist collaboration. Code prototyping validates feasibility before asking multiple teams to implement. Establishing patterns working across diverse product needs. Work about governance and scalability—maintaining consistency while enabling innovation.*

*What remains constant: Systematic thinking adapting to context. Cross-functional collaboration. Strategic focus on high-leverage work. Craft + infrastructure balance. Enabling independent work.*

*Different stages, different skills, but both require systematic thinking. Proven capability at both extremes: create foundational infrastructure AND contribute to systems at massive scale.*

---

## Impact: Measurable Outcomes

**[Visual 7: Expanding ripple effect showing system impact propagating across multiple dimensions]**

### Results Across Organizational Contexts

**For emerging technology organizations:**
- Systematic infrastructure established where no precedent existed
- Flexibility maintained as technology matured through multiple pivots
- Friction reduced between design and engineering through clear specifications
- Research and testing capabilities enabled for novel interactions
- Foundation created that continues scaling beyond initial implementation

**For established organizations at scale:**
- Components architected that work across multiple products and teams
- Governance and documentation established enabling consistent contribution
- Accessibility and performance standards maintained (WCAG AA compliance)
- Patterns implemented that enable independent team decision-making
- Consistency achieved across millions of daily user interactions

**Demonstrated capabilities:**
- **0→1 systems building** in environments with no precedent
- **Technical depth** spanning motion design, prototyping, and code
- **Cross-functional collaboration** across design, engineering, research, product
- **Strategic thinking** identifying highest-leverage interventions
- **Adaptability** across organizational stages and technical constraints
- **Proven versatility** from creating foundational infrastructure to governing mature systems

**SPEAKER NOTES:**
*Specific metrics (confidential but can speak to in interview):*

*Google: Built first natural-scale design system for this technology. Component library used daily by entire product team. Eliminated design-to-dev handoff bottlenecks through systematic specs. Enabled successful user research through custom prototyping. Adapted complete system to major product pivot without rebuilding—saved estimated 3+ months. Created enabling tools multiplying team productivity. System remained flexible through product changes. Components and patterns reused across features. Systematic approach adopted by new team members.*

*Apple: Architected core components for design system serving 20+ product teams. Millions of daily visitors. WCAG AA accessibility compliance. Multi-audience documentation. Code prototyping catching issues early. Patterns enabling independent decision-making.*

*What this demonstrates: 0→1 building capability. Technical depth bridging gaps. Cross-functional collaboration driving adoption. Strategic identification of high-leverage work. Adaptation across different organizational needs. Versatility from foundation-building to scaling.*

---

## Principles: Core Systematic Approach

### Demonstrated Methodology

**Start with quick wins**  
Prove systematic thinking solves real problems before requesting larger infrastructure investment. Credibility enables ambitious systematic work.

**Build on patterns, not pixels**  
Principle-based systems survive pivots that break rigid specifications. Flexibility is essential, not optional.

**Bridge design and engineering**  
Effective systems designers understand both design intent and technical reality. Proactive bridging eliminates organizational friction.

**Think beyond UI components**  
Highest-impact work often comes from enabling tools and team multiplication, not component creation.

**Enable independent decision-making**  
Success measured by team confidence working independently, not by design involvement in every decision.

**Adapt to organizational stage**  
Different contexts require different tactical approaches to the same core systematic thinking.

---

## Differentiated Approach

**Motion design expertise:**  
Complex interaction specifications that most systems designers cannot provide. Motion guidelines, high-fidelity prototypes, technical collaboration on implementations others cannot touch.

**Technical depth:**  
Prototyping and code skills bridge design-engineering gaps in ways pure visual design cannot. Validation through working prototypes, specifications engineers can implement confidently.

**Visual craft:**  
Strengthens systematic work rather than competing with it. High-craft execution combined with systematic thinking creates adoptable, beautiful systems.

**Systems thinking:**  
Extends beyond UI to team enablement tools. Strategic identification of highest-leverage interventions before they're requested.

**Proven versatility:**  
Demonstrated capability from 0→1 foundational infrastructure to scaling at massive organizations. Not all designers work effectively at both extremes.

---

## Visual Concept Suggestions

### Visual 1: Opening Challenge
**Concept:** Undefined space coalescing into systematic structure
- **Left side:** Amorphous, undefined shapes floating in void (representing undefined technology space)
- **Center:** Transformation zone with particles organizing
- **Right side:** Clear geometric grid structure with organized components
- **Motion:** Continuous transformation, undefined → defined, chaos → system
- **Color:** Left grayscale/muted, right structured blue/cyan tones
- **P5.js:** Particle system with target attraction, noise-based movement on left becoming grid-locked on right

### Visual 2: Foundation Building
**Concept:** Small systematic actions building expanding foundation
- **Bottom:** Single small geometric block/action
- **Middle:** Expanding layers building upward, each representing compounding impact
- **Top:** Complex stable structure built from simple foundation
- **Motion:** Building upward progressively, showing accumulation
- **Color:** Foundation bold/saturated, upper layers deriving from base
- **P5.js:** Blocks stacking with physics, each new layer enabling next level

### Visual 3: Flexible Grid System
**Concept:** Grid morphing between configurations maintaining structure
- **Visual:** 8x6 grid of rectangles transforming between two distinct layouts
- **Layout A:** Traditional structured grid (initial state)
- **Layout B:** Completely different arrangement (post-pivot state)
- **Motion:** Smooth interpolation between states, grid lines remain visible
- **Color:** Grid lines consistent, fill colors shift to show transformation
- **P5.js:** Lerp function morphing positions, draggable slider to control transformation state

### Visual 4: Translation Layer
**Concept:** Design intent → systematic specs → technical implementation
- **Top layer:** Organic, flowing design shapes (intent)
- **Middle layer:** Structured grid with measurements (specifications)
- **Bottom layer:** Geometric precision (implementation)
- **Motion:** Smooth vertical transformation showing translation
- **Color:** Gradient from warm (design) through neutral to cool (engineering)
- **P5.js:** Three layers that separate/combine on scroll, showing translation process

### Visual 5: Network Multiplication
**Concept:** Single tool creating exponentially expanding connections
- **Center:** Single bright node (systematic tool)
- **Radiating:** Exponentially branching connections to team nodes
- **Endpoints:** Multiple outputs from each team node
- **Motion:** Network growing organically, connections multiplying
- **Color:** Center bright, connections fading outward, outputs lighting up
- **P5.js:** Force-directed graph with exponential branching, hover highlights influence paths

### Visual 6: Organizational Stages
**Concept:** Sparse foundational network vs. dense mature network
- **Left:** 5-8 large nodes, simple connections (0→1)
- **Right:** 30-50 small nodes, complex web (scale)
- **Shared:** Same underlying structural principles visible in both
- **Motion:** Left side growing/densifying into right side
- **Color:** Same palette, different density/opacity showing evolution
- **P5.js:** Two network states, toggle/fade between them, hover isolates one side

### Visual 7: Impact Propagation
**Concept:** System impact rippling across multiple dimensions
- **Center:** Core system implementation
- **Expanding:** Concentric ripples representing different impact dimensions
- **Dimensions:** Speed, quality, consistency, enablement (labeled at ripple intersections)
- **Motion:** Continuous rippling outward, interference patterns where dimensions interact
- **Color:** Each dimension different hue, blending where they overlap
- **P5.js:** Multiple ripple systems with different wavelengths, creating interference patterns