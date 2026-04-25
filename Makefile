.DEFAULT_GOAL := help

SHELL := /bin/bash
COMPOSE := docker compose -f deploy/docker-compose/docker-compose.dev.yml --env-file .env

.PHONY: help
help:  ## Komutlari listele
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Bağımlılıklar ===

.PHONY: env
env:  ## .env dosyasini .env.example'dan olustur; COMPOSE_DEV_SECRET yoksa uret
	@if [ ! -f .env ]; then cp .env.example .env && echo ".env olusturuldu."; else echo ".env mevcut."; fi
	@grep -qE '^COMPOSE_DEV_SECRET=.' .env 2>/dev/null || (echo "COMPOSE_DEV_SECRET=$$(openssl rand -hex 24)" >> .env && echo "COMPOSE_DEV_SECRET eklendi (Docker stack, tek paylasilan lokal sifre).")
	@grep -qE '^JWT_SIGNING_KEY=.' .env 2>/dev/null || (echo "JWT_SIGNING_KEY=$$(openssl rand -hex 32)" >> .env && echo "JWT_SIGNING_KEY eklendi (Identity imza anahtari, en az 32 karakter).")
	@echo "Uyarilar: .env icinde DEEPSEEK_API_KEY ve Mongo/Redis/MinIO baglanti satirlarini COMPOSE_DEV_SECRET ile doldurun."

.PHONY: up
up: env  ## Tum bagimliliklari (Postgres, RabbitMQ, Redis, ES, MinIO, MongoDB, ClamAV, Mailhog) baslat
	$(COMPOSE) up -d
	@echo ""
	@echo "Servisler:"
	@echo "  PostgreSQL:    localhost:5432  (kullanici/sifre: .env -> POSTGRES_USER / COMPOSE_DEV_SECRET)"
	@echo "  MongoDB:       localhost:27017"
	@echo "  RabbitMQ UI:   http://localhost:15672  (POSTGRES_USER / COMPOSE_DEV_SECRET)"
	@echo "  Redis:         localhost:6379  (sifre: COMPOSE_DEV_SECRET)"
	@echo "  Elasticsearch: http://localhost:9200"
	@echo "  MinIO API:     http://localhost:9000"
	@echo "  MinIO Console: http://localhost:9001  (POSTGRES_USER / COMPOSE_DEV_SECRET)"
	@echo "  Mailhog UI:    http://localhost:8025"

.PHONY: down
down:  ## Tum bagimliliklari durdur
	$(COMPOSE) down

.PHONY: nuke
nuke:  ## Tum bagimliliklari + verileri sil (DIKKAT)
	$(COMPOSE) down -v

.PHONY: ps
ps:  ## Calisan container'lari goster
	$(COMPOSE) ps

.PHONY: logs
logs:  ## docker compose loglarini takip et
	$(COMPOSE) logs -f --tail=100

# === .NET Build / Test ===

.PHONY: restore
restore:  ## NuGet paketlerini geri yukle
	dotnet restore DijitalAtolye.sln

.PHONY: build
build:  ## Tum projeleri build et
	dotnet build DijitalAtolye.sln --no-restore -c Debug

.PHONY: test
test:  ## Tum unit + integration testleri calistir (CategoryFilter ile LiveLLM hariclenir)
	dotnet test DijitalAtolye.sln --no-build --filter "Category!=LiveLLM" --logger "console;verbosity=normal"

.PHONY: test-llm
test-llm:  ## LiveLLM testleri (gercek DeepSeek API, .env'de DEEPSEEK_API_KEY gerekli)
	dotnet test DijitalAtolye.sln --filter "Category=LiveLLM"

.PHONY: format
format:  ## dotnet format calistir
	dotnet format DijitalAtolye.sln

.PHONY: clean
clean:  ## bin/obj klasorlerini temizle
	find src tests -type d \( -name bin -o -name obj \) -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned."

# === Migrations ===

.PHONY: migrate
migrate:  ## Tum servislerin EF Core migration'larini calistir
	@for svc in Identity User Catalog Content Review Notification; do \
		echo ">>> Migrating $$svc..."; \
		dotnet ef database update --project src/Services/$$svc/$$svc.Infrastructure --startup-project src/Services/$$svc/$$svc.API || exit 1; \
	done

.PHONY: migration-add
migration-add:  ## Servise yeni migration ekle (kullanim: make migration-add SVC=Identity NAME=AddUserClaims)
	dotnet ef migrations add $(NAME) --project src/Services/$(SVC)/$(SVC).Infrastructure --startup-project src/Services/$(SVC)/$(SVC).API

# === Servisleri calistir ===

.PHONY: run-gateway
run-gateway:  ## API Gateway'i baslat (port 5000)
	dotnet run --project src/ApiGateway/ApiGateway.csproj

.PHONY: run-identity
run-identity:  ## Identity servisini baslat (port 5001)
	dotnet run --project src/Services/Identity/Identity.API/Identity.API.csproj

.PHONY: run-user
run-user:  ## User servisini baslat (port 5002)
	dotnet run --project src/Services/User/User.API/User.API.csproj

.PHONY: run-catalog
run-catalog:  ## Catalog servisini baslat (port 5003)
	dotnet run --project src/Services/Catalog/Catalog.API/Catalog.API.csproj

.PHONY: run-storage
run-storage:  ## Storage servisini baslat (port 5004)
	dotnet run --project src/Services/Storage/Storage.API/Storage.API.csproj

.PHONY: run-content
run-content:  ## Content servisini baslat (port 5005)
	dotnet run --project src/Services/Content/Content.API/Content.API.csproj

.PHONY: run-aimoderation
run-aimoderation:  ## AI Moderation servisini baslat (port 5006)
	dotnet run --project src/Services/AIModeration/AIModeration.API/AIModeration.API.csproj

.PHONY: run-review
run-review:  ## Review servisini baslat (port 5007)
	dotnet run --project src/Services/Review/Review.API/Review.API.csproj

.PHONY: run-notification
run-notification:  ## Notification servisini baslat (port 5008)
	dotnet run --project src/Services/Notification/Notification.API/Notification.API.csproj

# === Frontend ===

.PHONY: web-install
web-install:  ## Frontend bagimliliklarini yukle
	cd src/Web/dijitalatolye-web && npm install

.PHONY: web
web:  ## Frontend dev sunucusu (port 5173)
	cd src/Web/dijitalatolye-web && npm run dev

.PHONY: web-build
web-build:  ## Frontend production build
	cd src/Web/dijitalatolye-web && npm run build

.PHONY: web-test
web-test:  ## Frontend testleri
	cd src/Web/dijitalatolye-web && npm run test

# === Docker images ===

.PHONY: docker-build
docker-build:  ## Tum servislerin Docker image'larini build et
	./scripts/build-images.sh

# === Tum sistemi Docker'da ayaga kaldir ===

FULL_COMPOSE := docker compose -f deploy/docker-compose/docker-compose.full.yml --env-file .env

.PHONY: up-full
up-full: env  ## Tum sistemi (infra + servisler + frontend) Docker'da baslat
	$(FULL_COMPOSE) up -d --build
	@echo ""
	@echo "==> Tum sistem ayakta:"
	@echo "  Web (frontend):   http://localhost:8080"
	@echo "  API Gateway:      http://localhost:5000"
	@echo "  Identity:         http://localhost:5001"
	@echo "  RabbitMQ UI:      http://localhost:15672  (dijitalatolye/dijitalatolye)"
	@echo "  MinIO Console:    http://localhost:9001   (dijitalatolye/dijitalatolye)"
	@echo "  MailHog UI:       http://localhost:8025"
	@echo "  Loglar: make logs-full"

.PHONY: down-full
down-full:  ## Tum sistemi durdur (volume korunur)
	$(FULL_COMPOSE) down

.PHONY: nuke-full
nuke-full:  ## Tum sistemi + volume'lari sil (DIKKAT)
	$(FULL_COMPOSE) down -v

.PHONY: ps-full
ps-full:  ## Calisan container'lari goster
	$(FULL_COMPOSE) ps

.PHONY: logs-full
logs-full:  ## Tum servislerin loglarini takip et
	$(FULL_COMPOSE) logs -f --tail=100

.PHONY: rebuild
rebuild:  ## Tum servisleri yeniden build et ve baslat (kullanim: make rebuild SVC=identity)
	$(FULL_COMPOSE) up -d --build $(SVC)

.PHONY: helm-lint
helm-lint:  ## Helm chart'lari lint
	@for chart in deploy/helm/*/; do \
		echo ">>> Linting $$chart"; \
		helm lint "$$chart"; \
	done
