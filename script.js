        // User data storage
        let userData = {
            email: '',
            password: '',
            name: '',
            age: '',
            purposes: []
        };

        // Interest categories
        const categories = {
            medical: ['Patient Care', 'Research', 'Healthcare Admin', 'Medical Records', 'Prescriptions', 'Lab Results'],
            business: ['Sales', 'Marketing', 'Operations', 'HR', 'Contracts', 'Invoicing'],
            finance: ['Banking', 'Investments', 'Tax Forms', 'Budgeting', 'Insurance', 'Accounting'],
            education: ['Student Records', 'Grading', 'Curriculum', 'Attendance', 'Enrollment', 'Scholarships'],
            personal: ['Travel', 'Events', 'Surveys', 'Applications', 'Registration', 'Memberships']
        };

        let currentCategory = 'medical';
        let selectedPurposes = [];

        // Initialize
        window.onload = function() {
            renderInterests();
        };

        // Toggle password visibility
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            input.type = input.type === 'password' ? 'text' : 'password';
        }

        // Show signup page
        function showSignup() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('signupPage').classList.remove('hidden');
        }

        // Show login page
        function showLogin() {
            document.getElementById('signupPage').classList.add('hidden');
            document.getElementById('loginPage').classList.remove('hidden');
        }

        // Switch category
        function switchCategory(category) {
            currentCategory = category;
            
            // Update active tab
            document.querySelectorAll('.category-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            renderInterests();
        }

        // Render interests
        function renderInterests() {
            const container = document.getElementById('interestsContainer');
            container.innerHTML = '';
            
            categories[currentCategory].forEach(interest => {
                const tag = document.createElement('div');
                tag.className = 'interest-tag';
                tag.textContent = interest;
                
                if (selectedPurposes.includes(interest)) {
                    tag.classList.add('selected');
                }
                
                tag.onclick = function() {
                    toggleInterest(interest, tag);
                };
                
                container.appendChild(tag);
            });
        }

        // Toggle interest selection
        function toggleInterest(interest, element) {
            if (selectedPurposes.includes(interest)) {
                selectedPurposes = selectedPurposes.filter(i => i !== interest);
                element.classList.remove('selected');
            } else {
                selectedPurposes.push(interest);
                element.classList.add('selected');
            }
        }

        // Add custom interest
        function addCustomInterest() {
            const input = document.getElementById('customInterest');
            const value = input.value.trim();
            
            if (value && !selectedPurposes.includes(value)) {
                selectedPurposes.push(value);
                
                // Add to current category
                if (!categories[currentCategory].includes(value)) {
                    categories[currentCategory].push(value);
                }
                
                input.value = '';
                renderInterests();
            }
        }

        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            userData.email = document.getElementById('loginEmail').value;
            userData.password = document.getElementById('loginPassword').value;
            
            console.log('Login Data:', userData);
            alert('Login successful! Check console for user data.');
            
            // Redirect to home page
            window.location.href = '#';
        });

        // Signup form submission
        document.getElementById('signupForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            userData.name = document.getElementById('signupName').value;
            userData.age = document.getElementById('signupAge').value;
            userData.email = document.getElementById('signupEmail').value;
            userData.password = document.getElementById('signupPassword').value;
            userData.purposes = [...selectedPurposes];
            
            console.log('Signup Data:', userData);
            alert('Signup successful! Check console for user data.');
            
            // Redirect to home page
            window.location.href = '#';
        });