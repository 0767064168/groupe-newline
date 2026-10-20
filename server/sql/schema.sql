-- MySQL schema for GroupeNewline

CREATE DATABASE IF NOT EXISTS groupe_newline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE groupe_newline;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  tel VARCHAR(60) NOT NULL,
  date_event DATE NOT NULL,
  type VARCHAR(30) NOT NULL,
  guests INT NOT NULL,
  message TEXT,
  statut VARCHAR(30) NOT NULL DEFAULT 'En attente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL
);

CREATE INDEX idx_reservations_statut ON reservations(statut);
CREATE INDEX idx_reservations_type ON reservations(type);
CREATE INDEX idx_reservations_email ON reservations(email);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  sujet VARCHAR(190) NULL,
  message TEXT NOT NULL,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL
);

CREATE INDEX idx_messages_lu ON messages(lu);
CREATE INDEX idx_messages_email ON messages(email);

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  titre VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL UNIQUE,
  tag VARCHAR(60) NOT NULL,
  emoji VARCHAR(16) NULL,
  extrait TEXT NULL,
  date_publication DATE NULL,
  contenu MEDIUMTEXT NULL,
  vues INT NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL
);

CREATE INDEX idx_blog_posts_tag ON blog_posts(tag);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);

CREATE TABLE IF NOT EXISTS media_gallery (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  titre VARCHAR(220) NOT NULL,
  cat VARCHAR(60) NULL,
  media_type VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_media_gallery_cat ON media_gallery(cat);
CREATE INDEX idx_media_gallery_sort ON media_gallery(sort_order);

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  role VARCHAR(190) NULL,
  note INT NOT NULL DEFAULT 5,
  message TEXT NOT NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL
);

CREATE INDEX idx_testimonials_published ON testimonials(published);
CREATE INDEX idx_testimonials_created ON testimonials(created_at);



