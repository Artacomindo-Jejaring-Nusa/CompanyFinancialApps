pipeline {
    agent {
        label 'finance-agent'
    }

    environment {
        APP_NAME = 'CompanyFinancialApps'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                echo 'Mengambil kode terbaru dari repository...'
                checkout scm
            }
        }

        stage('Prepare Environment Files') {
            steps {
                echo 'Memverifikasi dan menyiapkan file variabel lingkungan (.env)...'
                sh '''
                    if [ ! -f .env ]; then
                        echo "Membuat file root .env dari .env.example..."
                        cp .env.example .env
                    fi

                    if [ ! -f backend/.env ]; then
                        echo "Membuat file backend/.env dari backend/.env.example..."
                        cp backend/.env.example backend/.env
                    fi
                '''
            }
        }

        stage('Build & Deploy Container') {
            steps {
                echo 'Memulai proses pembangunan kontainer Docker...'
                sh '''
                    docker compose down --remove-orphans || true
                    docker compose up -d --build
                '''
            }
        }

        stage('Verify Deployment Health') {
            steps {
                echo 'Memverifikasi status kontainer dan API Health Check...'
                sh '''
                    sleep 5
                    docker compose ps
                    curl -f http://localhost:8080/health || exit 1
                '''
            }
        }

        stage('Cleanup Old Docker Cache') {
            steps {
                echo 'Membersihkan image docker lama yang tidak terpakai...'
                sh 'docker image prune -f || true'
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Deployment CompanyFinancialApps berhasil diselesaikan pada Agent.'
        }
        failure {
            echo 'FAILURE: Proses deployment gagal! Periksa log terminal Jenkins.'
        }
    }
}
