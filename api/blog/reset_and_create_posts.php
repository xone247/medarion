<?php
// Script to delete all blog posts and create 10 new professional blog posts
// This script is for testing purposes

header('Content-Type: application/json');

try {
    // Include database configuration
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    
    // Get admin user ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND is_active = 1 LIMIT 1");
    $stmt->execute(['superadmin@medarion.com']);
    $adminUser = $stmt->fetch();
    
    if (!$adminUser) {
        // Try to get any admin user
        $stmt = $pdo->prepare("SELECT id FROM users WHERE is_admin = 1 AND is_active = 1 LIMIT 1");
        $stmt->execute();
        $adminUser = $stmt->fetch();
    }
    
    if (!$adminUser) {
        // Default to user ID 1
        $adminUserId = 1;
    } else {
        $adminUserId = (int)$adminUser['id'];
    }
    
    // Delete all existing blog posts
    $stmt = $pdo->prepare("DELETE FROM blog_posts");
    $stmt->execute();
    $deletedCount = $stmt->rowCount();
    
    // Define 10 professional blog posts
    $posts = [
        [
            'title' => 'The Future of Healthcare Technology: Digital Transformation in Medical Practice',
            'excerpt' => 'Explore how cutting-edge technology is revolutionizing healthcare delivery, from telemedicine to AI-powered diagnostics, and what it means for medical professionals and patients alike.',
            'content' => '<h2>Introduction to Healthcare Technology Revolution</h2><p>The healthcare industry is experiencing an unprecedented technological transformation. Digital innovations are reshaping how medical professionals diagnose, treat, and manage patient care. This comprehensive guide explores the latest trends and their impact on healthcare delivery.</p><h3>Telemedicine: Bridging Distance in Healthcare</h3><p>Telemedicine has emerged as a critical component of modern healthcare. With the ability to conduct remote consultations, healthcare providers can reach patients in remote areas, reduce travel time, and improve accessibility. Studies show that telemedicine consultations have increased by over 300% in recent years, making healthcare more accessible than ever before.</p><h3>Artificial Intelligence in Medical Diagnostics</h3><p>AI-powered diagnostic tools are revolutionizing medical imaging and analysis. Machine learning algorithms can now detect diseases earlier and with greater accuracy than traditional methods. From radiology to pathology, AI is assisting healthcare professionals in making more informed decisions.</p><h3>The Role of Electronic Health Records</h3><p>Electronic Health Records (EHRs) have transformed patient data management. These digital systems enable seamless information sharing between healthcare providers, reduce medical errors, and improve patient outcomes. The integration of EHRs with AI and analytics is creating new possibilities for personalized medicine.</p><h2>Looking Ahead</h2><p>As technology continues to evolve, healthcare professionals must adapt to new tools and methodologies. The future promises even more exciting developments, from precision medicine to advanced robotics in surgery. Embracing these changes will be crucial for delivering optimal patient care.</p>',
            'category' => 'Healthcare Technology',
            'read_time' => '8 min read',
            'featured' => true,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Understanding Clinical Trials: A Comprehensive Guide for Patients and Researchers',
            'excerpt' => 'Navigate the complex world of clinical trials with this detailed guide covering everything from trial phases to patient rights and the importance of diverse participation in medical research.',
            'content' => '<h2>What Are Clinical Trials?</h2><p>Clinical trials are research studies that explore whether a medical strategy, treatment, or device is safe and effective for humans. These studies may also show which medical approaches work best for certain illnesses or groups of people.</p><h3>The Four Phases of Clinical Trials</h3><p><strong>Phase I:</strong> These trials test a new treatment in a small group of people for the first time to evaluate its safety, determine a safe dosage range, and identify side effects.</p><p><strong>Phase II:</strong> The treatment is given to a larger group of people to see if it is effective and to further evaluate its safety.</p><p><strong>Phase III:</strong> These trials gather more information about safety and effectiveness by studying different populations and different dosages, and by using the treatment in combination with other drugs.</p><p><strong>Phase IV:</strong> Post-marketing studies delineate additional information including the treatment\'s risks, benefits, and optimal use.</p><h3>Patient Rights and Protections</h3><p>All clinical trial participants have specific rights protected by law. These include the right to informed consent, the right to withdraw at any time, and the right to privacy. Institutional Review Boards (IRBs) oversee clinical trials to ensure participant safety and ethical standards.</p><h3>The Importance of Diversity in Clinical Trials</h3><p>Diverse participation in clinical trials is crucial for ensuring that treatments are effective for all populations. Different groups may respond differently to treatments, making inclusive research essential for advancing medical knowledge.</p><h2>Participating in Clinical Trials</h2><p>If you\'re considering participating in a clinical trial, it\'s important to discuss your options with your healthcare provider. They can help you understand the risks and benefits and determine if participation is right for you.</p>',
            'category' => 'Clinical Research',
            'read_time' => '10 min read',
            'featured' => true,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Mental Health in the Digital Age: Leveraging Technology for Better Care',
            'excerpt' => 'Discover how digital mental health solutions are making therapy and support more accessible, including apps, online counseling, and AI-powered mental health tools that are changing the landscape of care.',
            'content' => '<h2>The Digital Mental Health Revolution</h2><p>Mental health care has undergone a significant transformation with the advent of digital technologies. From mobile apps to teletherapy platforms, technology is breaking down barriers to mental health support and making care more accessible.</p><h3>Mental Health Apps and Digital Tools</h3><p>Mobile applications designed for mental health offer various features including mood tracking, meditation guides, cognitive behavioral therapy exercises, and crisis support. These tools provide users with immediate access to resources and can complement traditional therapy.</p><h3>Teletherapy: Counseling from Anywhere</h3><p>Online therapy platforms have made professional mental health support available to people regardless of their location. Video conferencing technology allows therapists to conduct sessions remotely, making therapy more convenient and accessible for those with mobility issues or busy schedules.</p><h3>AI and Machine Learning in Mental Health</h3><p>Artificial intelligence is being used to identify patterns in mental health data, predict crises, and provide personalized recommendations. AI chatbots can offer 24/7 support and help identify when professional intervention may be needed.</p><h3>Privacy and Security Considerations</h3><p>While digital mental health tools offer many benefits, it\'s crucial to consider privacy and security. Users should ensure that platforms comply with healthcare privacy regulations like HIPAA and understand how their data is being used and protected.</p><h2>The Future of Digital Mental Health</h2><p>As technology continues to evolve, we can expect to see more sophisticated tools for mental health care. Virtual reality therapy, advanced AI diagnostics, and integrated care platforms are just a few of the innovations on the horizon.</p>',
            'category' => 'Mental Health',
            'read_time' => '7 min read',
            'featured' => false,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Precision Medicine: Tailoring Treatment to Individual Genetics',
            'excerpt' => 'Learn how precision medicine is revolutionizing healthcare by using genetic information to customize treatments, improve outcomes, and reduce adverse effects through personalized therapeutic approaches.',
            'content' => '<h2>What is Precision Medicine?</h2><p>Precision medicine, also known as personalized medicine, is an approach to patient care that considers individual variability in genes, environment, and lifestyle. This approach enables doctors and researchers to predict more accurately which treatment and prevention strategies will work for specific groups of people.</p><h3>Genomics and Personalized Treatment</h3><p>Advances in genomics have made it possible to sequence an individual\'s genome relatively quickly and affordably. This genetic information can be used to understand how a person might respond to certain medications, identify genetic predispositions to diseases, and develop targeted treatments.</p><h3>Pharmacogenomics: Right Drug, Right Dose</h3><p>Pharmacogenomics studies how genes affect a person\'s response to drugs. By understanding genetic variations, healthcare providers can prescribe medications that are more likely to be effective and less likely to cause adverse reactions. This is particularly important for medications with narrow therapeutic windows.</p><h3>Cancer Treatment and Precision Medicine</h3><p>Precision medicine has made significant strides in oncology. Targeted therapies can now attack specific cancer cells based on their genetic mutations, leading to more effective treatments with fewer side effects. Biomarker testing helps identify which patients will benefit most from specific treatments.</p><h3>Challenges and Future Directions</h3><p>While precision medicine holds great promise, challenges remain including cost, data privacy, and ensuring equitable access to these advanced treatments. As technology continues to advance and costs decrease, precision medicine is becoming more accessible.</p><h2>Real-World Applications</h2><p>Precision medicine is already being used in various medical specialties, from oncology to cardiology. As our understanding of genetics and disease mechanisms improves, this approach will become increasingly common in routine medical care.</p>',
            'category' => 'Medical Research',
            'read_time' => '9 min read',
            'featured' => true,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'The Importance of Medical Grants: Funding Breakthrough Research',
            'excerpt' => 'Explore how medical grants fuel innovation in healthcare research, the types of grants available, and how researchers can successfully secure funding for their groundbreaking studies.',
            'content' => '<h2>Understanding Medical Research Funding</h2><p>Medical grants are essential for advancing healthcare research and innovation. These funding opportunities enable researchers to conduct studies that could lead to breakthrough treatments, improved diagnostic tools, and better understanding of diseases.</p><h3>Types of Medical Grants</h3><p><strong>Government Grants:</strong> Federal agencies like the National Institutes of Health (NIH) provide substantial funding for medical research. These grants support basic research, clinical trials, and translational research.</p><p><strong>Foundation Grants:</strong> Private foundations and nonprofit organizations offer grants focused on specific diseases or research areas. These grants often fund innovative, high-risk research that might not qualify for government funding.</p><p><strong>Industry Grants:</strong> Pharmaceutical and biotechnology companies provide grants for research that aligns with their therapeutic areas of interest.</p><h3>The Grant Application Process</h3><p>Securing a medical grant requires careful preparation. Researchers must clearly articulate their research question, methodology, expected outcomes, and impact. Strong proposals demonstrate innovation, feasibility, and potential to advance medical knowledge.</p><h3>Common Challenges in Grant Writing</h3><p>Writing compelling grant proposals can be challenging. Common pitfalls include unclear research objectives, insufficient preliminary data, unrealistic timelines, and inadequate budgets. Seeking feedback from experienced grant writers and colleagues can help improve proposals.</p><h3>Impact of Medical Grants</h3><p>Medical grants have funded countless breakthrough discoveries, from new cancer treatments to vaccines. These funding opportunities enable researchers to take risks and explore innovative approaches that might not otherwise be pursued.</p><h2>Future of Medical Research Funding</h2><p>As healthcare challenges evolve, funding priorities shift accordingly. Researchers should stay informed about emerging funding opportunities and align their research with current priorities while maintaining scientific integrity.</p>',
            'category' => 'Medical Research',
            'read_time' => '8 min read',
            'featured' => false,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Healthcare Data Security: Protecting Patient Information in the Digital Era',
            'excerpt' => 'Learn about the critical importance of healthcare data security, common threats, compliance requirements, and best practices for protecting sensitive patient information in today\'s connected healthcare environment.',
            'content' => '<h2>The Critical Need for Healthcare Data Security</h2><p>Healthcare organizations handle vast amounts of sensitive patient data, making them prime targets for cyberattacks. Protecting this information is not just a legal requirement but a moral imperative to maintain patient trust and safety.</p><h3>Common Healthcare Cybersecurity Threats</h3><p>Healthcare organizations face numerous cybersecurity threats including ransomware attacks, phishing scams, data breaches, and insider threats. These attacks can disrupt patient care, compromise sensitive information, and result in significant financial losses.</p><h3>HIPAA Compliance and Data Protection</h3><p>The Health Insurance Portability and Accountability Act (HIPAA) sets standards for protecting sensitive patient data. Healthcare organizations must implement administrative, physical, and technical safeguards to ensure HIPAA compliance and protect patient privacy.</p><h3>Best Practices for Healthcare Data Security</h3><p>Effective healthcare data security requires a multi-layered approach including encryption, access controls, regular security audits, employee training, and incident response plans. Organizations should also implement strong authentication methods and maintain regular backups.</p><h3>Emerging Technologies and Security</h3><p>As healthcare organizations adopt new technologies like cloud computing, IoT devices, and mobile health apps, new security challenges emerge. It\'s essential to ensure that security is built into these technologies from the ground up.</p><h3>Building a Security Culture</h3><p>Creating a culture of security awareness is crucial. All staff members should understand their role in protecting patient data and be trained to recognize and respond to security threats.</p><h2>Looking Forward</h2><p>As healthcare becomes increasingly digital, maintaining robust security measures will be essential. Organizations must stay ahead of evolving threats and continuously update their security practices to protect patient information.</p>',
            'category' => 'Healthcare Technology',
            'read_time' => '9 min read',
            'featured' => false,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Telemedicine Best Practices: Delivering Quality Care Remotely',
            'excerpt' => 'Explore best practices for conducting effective telemedicine consultations, including technology setup, patient communication, documentation, and ensuring quality care delivery in virtual settings.',
            'content' => '<h2>Mastering Telemedicine Care Delivery</h2><p>Telemedicine has become an integral part of modern healthcare delivery. To provide quality care remotely, healthcare providers must follow best practices that ensure patient safety, effective communication, and appropriate documentation.</p><h3>Technology Setup and Requirements</h3><p>Successful telemedicine consultations require reliable technology. Healthcare providers should use HIPAA-compliant platforms with high-quality video and audio capabilities. Both providers and patients need stable internet connections and appropriate devices for optimal communication.</p><h3>Pre-Consultation Preparation</h3><p>Before the consultation, providers should verify patient identity, ensure privacy, and test technology. Patients should receive clear instructions on how to access the platform and what to expect during the appointment.</p><h3>Conducting Effective Remote Consultations</h3><p>During telemedicine visits, providers should maintain eye contact (by looking at the camera), speak clearly, and actively listen. Visual cues may be limited, so verbal communication and clear explanations become even more important.</p><h3>Documentation and Follow-Up</h3><p>Proper documentation is essential for telemedicine consultations. Providers should document the encounter in the same detail as in-person visits, including chief complaint, history, examination findings, assessment, and plan. Follow-up instructions should be clearly communicated.</p><h3>Special Considerations</h3><p>Not all conditions are suitable for telemedicine. Providers must assess whether a condition can be appropriately evaluated remotely or requires an in-person visit. Emergency situations require immediate in-person evaluation.</p><h2>Ensuring Quality Care</h2><p>By following best practices, healthcare providers can deliver high-quality care through telemedicine while maintaining patient safety and satisfaction. As telemedicine continues to evolve, staying current with best practices and regulations is essential.</p>',
            'category' => 'Healthcare Technology',
            'read_time' => '7 min read',
            'featured' => false,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Medical Device Innovation: Advancing Patient Care Through Technology',
            'excerpt' => 'Discover how innovative medical devices are transforming patient care, from wearable health monitors to advanced surgical robotics, and the regulatory landscape that ensures their safety and efficacy.',
            'content' => '<h2>The Era of Medical Device Innovation</h2><p>Medical devices play a crucial role in modern healthcare, from simple diagnostic tools to complex life-support systems. Innovation in medical devices is advancing rapidly, improving patient outcomes and transforming care delivery.</p><h3>Wearable Health Technology</h3><p>Wearable devices like smartwatches and fitness trackers are becoming increasingly sophisticated, capable of monitoring heart rate, blood oxygen levels, sleep patterns, and more. These devices enable continuous health monitoring and early detection of potential issues.</p><h3>Robotic Surgery and Precision Procedures</h3><p>Robotic surgical systems allow surgeons to perform complex procedures with enhanced precision, smaller incisions, and faster recovery times. These systems combine human expertise with advanced technology to improve surgical outcomes.</p><h3>AI-Powered Diagnostic Devices</h3><p>Medical devices integrated with artificial intelligence can analyze medical images, detect abnormalities, and assist in diagnosis. These AI-powered tools can enhance accuracy and speed up the diagnostic process.</p><h3>Implantable Medical Devices</h3><p>Implantable devices like pacemakers, insulin pumps, and neural implants are becoming more advanced and personalized. These devices can monitor conditions in real-time and deliver treatments automatically.</p><h3>Regulatory Considerations</h3><p>Medical devices must undergo rigorous testing and regulatory approval before they can be used clinically. Understanding the regulatory pathway is essential for device developers and healthcare providers.</p><h2>Future Directions</h2><p>The future of medical devices holds exciting possibilities, from nanotechnology-based devices to brain-computer interfaces. As technology advances, these innovations will continue to reshape healthcare delivery.</p>',
            'category' => 'Healthcare Technology',
            'read_time' => '8 min read',
            'featured' => false,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Global Health Partnerships: Collaborating for Better Outcomes',
            'excerpt' => 'Explore how international partnerships in healthcare are addressing global health challenges, sharing knowledge and resources, and improving health outcomes in underserved communities worldwide.',
            'content' => '<h2>The Power of Global Health Collaboration</h2><p>Healthcare challenges transcend borders, making global health partnerships essential for addressing complex health issues. These collaborations bring together resources, expertise, and perspectives from around the world to tackle pressing health problems.</p><h3>Types of Global Health Partnerships</h3><p><strong>Academic Partnerships:</strong> Universities and research institutions collaborate across borders to conduct research, share knowledge, and train healthcare professionals.</p><p><strong>NGO Partnerships:</strong> Non-governmental organizations work together to deliver healthcare services, implement health programs, and advocate for health equity.</p><p><strong>Public-Private Partnerships:</strong> Collaboration between governments, private companies, and nonprofits can mobilize resources and expertise to address health challenges.</p><h3>Addressing Global Health Disparities</h3><p>Global health partnerships play a crucial role in reducing health disparities. By sharing resources, knowledge, and technology, these partnerships help ensure that healthcare innovations reach underserved populations.</p><h3>Knowledge Sharing and Capacity Building</h3><p>Effective partnerships focus on building local capacity rather than just providing aid. This includes training healthcare workers, transferring technology, and supporting local health systems.</p><h3>Challenges in Global Health Partnerships</h3><p>Partnerships face challenges including cultural differences, resource constraints, political instability, and ensuring sustainability. Success requires long-term commitment, cultural sensitivity, and respect for local expertise.</p><h2>Success Stories</h2><p>Numerous global health partnerships have achieved remarkable success, from eradicating diseases to improving maternal and child health. These partnerships demonstrate the power of collaboration in addressing health challenges.</p><h2>Looking Ahead</h2><p>As global health challenges evolve, partnerships will continue to be essential. Building strong, equitable partnerships will be key to achieving health equity and addressing emerging health threats.</p>',
            'category' => 'Global Health',
            'read_time' => '9 min read',
            'featured' => false,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=600&fit=crop'
        ],
        [
            'title' => 'Evidence-Based Medicine: Making Informed Clinical Decisions',
            'excerpt' => 'Learn about evidence-based medicine principles, how to critically appraise medical literature, and integrate research evidence with clinical expertise to make the best decisions for patient care.',
            'content' => '<h2>Understanding Evidence-Based Medicine</h2><p>Evidence-based medicine (EBM) is the conscientious, explicit, and judicious use of current best evidence in making decisions about the care of individual patients. It integrates clinical expertise with the best available research evidence and patient values.</p><h3>The Three Pillars of EBM</h3><p><strong>Best Research Evidence:</strong> This involves finding and appraising the most current and relevant research studies that address the clinical question at hand.</p><p><strong>Clinical Expertise:</strong> Healthcare providers bring their knowledge, experience, and clinical skills to interpret and apply research evidence appropriately.</p><p><strong>Patient Values:</strong> Patient preferences, concerns, and expectations must be considered when making clinical decisions.</p><h3>Critical Appraisal of Medical Literature</h3><p>Critical appraisal involves systematically evaluating research studies to determine their validity, reliability, and applicability to clinical practice. This includes assessing study design, methodology, statistical analysis, and potential biases.</p><h3>Finding and Using Medical Evidence</h3><p>Healthcare providers need skills to efficiently search medical databases, identify high-quality studies, and stay current with new research. Systematic reviews and meta-analyses are particularly valuable sources of evidence.</p><h3>Implementing Evidence in Practice</h3><p>Translating research evidence into clinical practice requires careful consideration of the specific patient context, available resources, and potential barriers to implementation. Clinical practice guidelines can help bridge this gap.</p><h3>Challenges and Limitations</h3><p>EBM faces challenges including the time required to find and appraise evidence, keeping up with rapidly expanding medical literature, and applying population-based evidence to individual patients.</p><h2>Advancing Clinical Practice</h2><p>Despite challenges, evidence-based medicine remains essential for providing high-quality, effective patient care. By continuously learning and applying EBM principles, healthcare providers can improve patient outcomes and advance medical practice.</p>',
            'category' => 'Medical Research',
            'read_time' => '10 min read',
            'featured' => true,
            'status' => 'published',
            'featured_image' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=600&fit=crop'
        ]
    ];
    
    // Insert each post
    $insertedPosts = [];
    $stmt = $pdo->prepare("
        INSERT INTO blog_posts (
            title, slug, content, excerpt, author_id, featured_image, 
            category, status, featured, read_time, published_at, created_at, updated_at
        ) VALUES (
            :title, :slug, :content, :excerpt, :author_id, :featured_image,
            :category, :status, :featured, :read_time, :published_at, NOW(), NOW()
        )
    ");
    
    foreach ($posts as $post) {
        // Generate slug from title
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $post['title'])));
        
        // Ensure slug is unique
        $originalSlug = $slug;
        $counter = 1;
        while (true) {
            $checkStmt = $pdo->prepare("SELECT id FROM blog_posts WHERE slug = ?");
            $checkStmt->execute([$slug]);
            if (!$checkStmt->fetch()) break;
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        $publishedAt = $post['status'] === 'published' ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([
            ':title' => $post['title'],
            ':slug' => $slug,
            ':content' => $post['content'],
            ':excerpt' => $post['excerpt'],
            ':author_id' => $adminUserId,
            ':featured_image' => $post['featured_image'],
            ':category' => $post['category'],
            ':status' => $post['status'],
            ':featured' => $post['featured'] ? 1 : 0,
            ':read_time' => $post['read_time'],
            ':published_at' => $publishedAt
        ]);
        
        $insertedPosts[] = [
            'id' => $pdo->lastInsertId(),
            'title' => $post['title'],
            'slug' => $slug,
            'status' => $post['status']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully deleted {$deletedCount} posts and created " . count($insertedPosts) . " new professional blog posts",
        'deleted_count' => $deletedCount,
        'created_posts' => $insertedPosts
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>

