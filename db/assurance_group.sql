-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 22 juin 2026 à 14:14
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `assurance_group`
--

-- --------------------------------------------------------

--
-- Structure de la table `adherent`
--

CREATE TABLE `adherent` (
  `id_adherent` int(11) NOT NULL,
  `matricule` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `etat_civil` varchar(50) DEFAULT NULL,
  `sexe` varchar(20) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `date_adhesion` date DEFAULT NULL,
  `adresse` varchar(500) NOT NULL,
  `cin` int(11) DEFAULT NULL,
  `telephone` varchar(30) NOT NULL,
  `identifiant` varchar(100) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `statut` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `adherent`
--

INSERT INTO `adherent` (`id_adherent`, `matricule`, `nom`, `prenom`, `etat_civil`, `sexe`, `date_naissance`, `date_adhesion`, `adresse`, `cin`, `telephone`, `identifiant`, `mot_de_passe`, `statut`) VALUES
(1, 661, 'BEN HMED', 'MOHSEN', 'M', 'H', '1968-11-12', NULL, '4015 Beni Rabiaa, BÃ©ni Rabiaa 4015', 4162860, '97225565', NULL, NULL, ''),
(2, 907, 'NOUIRA', 'KAMEL', 'M', 'H', '1968-10-11', NULL, '79 Rue du Caire, Zaouit Sousse', 5510722, '52483316', NULL, NULL, ''),
(3, 1754, 'MAHJOUB', 'RADHOUANE', 'C', 'H', '1980-10-28', NULL, 'NULL, CitÃ© Erriadh', 8425098, '97347013', NULL, NULL, ''),
(4, 809, 'HADJ AMMAR', 'KAMEL', 'M', 'H', '1964-08-24', NULL, '4025 Sidi El Hani, Sidi El HÃ©ni 4025', 2978228, '96542859', NULL, NULL, ''),
(5, 2200, 'MOHAMED', 'HANI', 'M', 'H', '1987-11-04', NULL, 'Aouled kbair, Sidi El HÃ©ni 4025', 9279896, '28118302', NULL, NULL, ''),
(6, 2036, 'BOUARGOUB', 'IMEDEDDINE', 'M', 'H', '1986-01-30', NULL, 'Rue Jedda, Msaken 4070', 8471520, '22833533', NULL, NULL, ''),
(7, 1576, 'MNED', 'MOHAMED BEN AHMED', 'M', 'H', '1972-01-03', NULL, '14 Rue du Caire, Msaken 4070', 5520953, '27465550', NULL, NULL, ''),
(8, 2205, 'GHEZAL', 'AHMED', 'Celibataire', 'Homme', '1991-07-09', NULL, '22 rue Salah Hafsa, Msaken', 9310482, '21828841', NULL, NULL, ''),
(9, 1613, 'BOUKADIDA', 'MOHAMED LAMINE', 'M', 'H', '1979-03-04', NULL, '209, Rue Ali Belhwane, Msaken 4070', 5549798, '27369484', NULL, NULL, ''),
(10, 2319, 'CHEBIL', 'JIHED', 'Celibataire', 'H', '1993-08-15', NULL, '51,Rue saida khadija, Msaken 4070', 9332095, '54095882', NULL, NULL, ''),
(11, 2210, 'CHEBIL', 'ALAA', 'M', 'H', '1993-08-15', NULL, '51, Rue Saida Khadija, Msaken', 9332093, '98793865', NULL, NULL, ''),
(12, 1990, 'HEDHILI', 'ZIED', 'C', 'H', '1987-11-03', NULL, 'Rue Chikh Ladheri, Msaken 4070', 9277250, '98793761', NULL, NULL, ''),
(13, 2198, 'HAMIDA', 'FEHMI', 'M', 'H', '1988-09-24', NULL, 'Beni Rabiaa, BÃ©ni Rabiaa 4015', 8495681, '50485983', NULL, NULL, ''),
(14, 2271, 'JERFEL', 'ZOUBAIER', 'M', 'H', '1990-07-30', NULL, '815 KAED ESSOUASSI, Sousse', 9299218, '54319494', NULL, NULL, ''),
(15, 2195, 'BOUHLEL', 'MOHAMED', 'M', 'H', '1998-07-10', NULL, '30 Rue les Oranges, Msaken 4070', 12829755, '24340299', NULL, NULL, ''),
(16, 2219, 'JARRAR', 'MOHAMED MAHDI', 'M', 'Homme', '1996-02-07', NULL, '55 ROUTE DE SFAX, SOUSSE', 9341975, '21230302', NULL, NULL, ''),
(17, 2229, 'MKHININI', 'BECHIR', 'M', 'Homme', '2000-10-15', NULL, 'RUE EL HADIBIA BIR JDID MSAKEN SOUSSE, MSAKEN', 12841871, '20043324', NULL, NULL, ''),
(18, 2227, 'BEN KALIA', 'HAMZA', 'Celibataire', 'Homme', '1999-04-29', NULL, 'RUE AMOR EL MOKHTAR MSAKEN SOUSSE, MSAKEN', 12854321, '26051730', NULL, NULL, ''),
(19, 2228, 'BELKHIRIA', 'SOLYMEN', 'M', 'Homme', '1995-12-22', NULL, '46 RUE 15 OCTOBER HAY SAADA ZOHOUR SOUSSE, SOUSSE', 9341275, '25025406', NULL, NULL, ''),
(20, 2213, 'BERRIRI', 'Mohamed Fredj', 'M', 'Homme', '1994-06-06', NULL, 'Rue El Wafa, Msaken', 9340270, '98793688', NULL, NULL, ''),
(21, 2243, 'BEN HADJ HASSINE', 'AYMEN', 'M', 'H', '1984-08-03', NULL, 'AOULED BOUBAKER, SIDI ELHENI', 8448925, '97140542', NULL, NULL, ''),
(22, 2258, 'GAIDA', 'MOHAMED', 'Celibataire', 'Homme', '1999-09-14', NULL, 'RUE SAYAR, MSAKEN', 12854216, '50437060', NULL, NULL, ''),
(23, 2179, 'BOUHLEL', 'AHMED', 'Celibataire', 'Homme', '1986-06-02', NULL, 'Rue Ariana, Msaken 4070', 9264856, '25658185', NULL, NULL, ''),
(24, 1785, 'HMIDI', 'SALEM', 'M', 'H', '1973-03-01', NULL, 'OULED BOUKRAA KNAIES, Knaies 4014', 5538168, '55905517', NULL, NULL, ''),
(25, 2184, 'BEN HADJ HASSINE', 'KHALED', 'M', 'H', '1990-03-01', NULL, 'Aouled Boubaker, Sidi El HÃ©ni 4025', 9323011, '55914772', NULL, NULL, ''),
(26, 2236, 'HEDHILI', 'MAHER', 'Celibataire', 'H', '1991-10-04', NULL, 'RUE MOHAMED ALI, Msaken 4070', 9315032, '98793896', NULL, NULL, ''),
(27, 2254, 'ZRELLI', 'MOHAMED ALI', 'Celibataire', 'H', '1998-06-26', NULL, 'HAY ENOUR RUE MAHATTET TATHIR, Msaken 4070', 12847640, '24345821', NULL, NULL, ''),
(28, 1713, 'SAKKA ROUIS', 'MOHAMED MAHER', 'Celibataire', 'H', '1977-12-04', NULL, '10 Rue Amman, Msaken 4070', 5564944, '24526655', NULL, NULL, ''),
(29, 2252, 'DAHMOUL', 'KAMEL', 'Celibataire', 'H', '1996-02-18', NULL, 'AVENUE ELHANA, Msaken 4070', 12805412, '98793690', NULL, NULL, ''),
(30, 2010, 'BEN ABDELJELIL', 'HOUCEM', 'Celibataire', 'H', '1990-06-22', NULL, '41, Rue Ali Belhouane, Msaken 4070', 9284482, '20040781', NULL, NULL, ''),
(31, 2270, 'BEL HADJ JRAD', 'MOHAMED', 'M', 'H', '1994-04-09', NULL, '60 RUE HABIB THAMER, Msaken 4070', 12802949, '24254848', NULL, NULL, ''),
(32, 2312, 'BOUARGOUB', 'ACHRAF', 'M', 'H', '1991-11-29', NULL, 'RUE CHAHID SALAH HAFSA, Msaken 4070', 9343239, '28159596', NULL, NULL, ''),
(33, 2276, 'ACHECHE', 'ALAEDDINE', 'Celibataire', 'H', '1991-02-18', NULL, 'Rue sidi belhassen, Msaken 4070', 9309648, '22086893', NULL, NULL, ''),
(34, 2343, 'BEN MAHMOUD', 'MOHAMED', 'Celibataire', 'H', '1997-02-18', NULL, 'HAY JADID BENI KALTHOUM, BENI KALTHOUM', 12833024, '29353816', NULL, NULL, ''),
(35, 2448, 'JARRAR', 'MOHAMED', 'M', 'H', '1993-05-10', NULL, 'AVENUE MOHAMED ALI, Msaken 4070', 9343156, '55242058', NULL, NULL, ''),
(36, 2275, 'BEN AHMED', 'NIZAR', 'M', 'H', '1995-09-14', NULL, 'MELICHET ZARMDINE, MONASTIR', 6960117, '98793686', NULL, NULL, ''),
(37, 2313, 'SASSI', 'MOHAMED ALI', 'Celibataire', 'H', '2002-09-15', NULL, '34 RUE MONASTIR, Msaken 4070', 12872305, '56032490', NULL, NULL, ''),
(38, 192, 'BEN ABDELJELIL', 'ABDELJELIL', 'M', 'H', '1965-08-20', NULL, '41 R Ali Belhouan, Msaken 4070', 2955305, '98793550', NULL, NULL, ''),
(39, 1716, 'HADJ ABDALLAH', 'NACEUR', 'M', 'H', '1975-04-07', NULL, '2 Rue Abdelhamid Gadhi, Msaken 4070', 5543141, '28125437', NULL, NULL, ''),
(40, 1866, 'JEBALI', 'MOHAMED', 'M', 'H', '1979-03-17', NULL, '22, Rue Kassara, Teboulba', 6789967, '94975177', NULL, NULL, ''),
(41, 2368, 'BOUGAMRA', 'ADEM', 'Celibataire', 'H', '2003-05-06', NULL, 'RUE BOULIBANA KSIBET CHAT, SOUSSE', 12868760, '93666947', NULL, NULL, ''),
(42, 2372, 'KECHICHE', 'FARES', 'Celibataire', 'H', '1991-04-22', NULL, 'RUE EL KHORTOUM, Msaken 4070', 9287631, '24341282', NULL, NULL, ''),
(43, 2246, 'ELGHAOUI', 'RAMI', 'M', 'H', '1993-07-23', NULL, 'RUE MAJIDA BOULILA N°42, SFAX', 11030567, '98793899', NULL, NULL, ''),
(44, 2282, 'BOUAICHA', 'YASSINE', 'Celibataire', 'H', '1991-11-14', NULL, 'AOULED NAHAR, KAIROUAN', 7740817, '92101398', NULL, NULL, ''),
(45, 2308, 'TERZEG BHIRI', 'ANIS', 'Celibataire', 'H', '1997-01-17', NULL, '68RUE TEZERKA, Msaken 4070', 12822583, '24132155', NULL, NULL, ''),
(46, 2363, 'KHEDHER', 'MOURAD', 'M', 'H', '1985-11-02', NULL, 'KAZZAZIA, KAIROUAN', 7698792, '93293700', NULL, NULL, ''),
(47, 2307, 'ZAGGAR', 'MAJD EDDINE', 'Celibataire', 'H', '1993-10-20', NULL, 'RUE BENGHAZI, Msaken 4070', 9345940, '24089114', NULL, NULL, ''),
(48, 2262, 'AKKARI', 'MAHMOUD', 'Celibataire', 'H', '1996-05-01', NULL, 'KNAIS, #N/A', 12822322, '22047022', NULL, NULL, ''),
(49, 2305, 'BRIKI', 'SABEUR', 'M', 'H', '1988-01-11', NULL, 'RUE SIDI AABAR, Msaken 4070', 9280692, '22478177', NULL, NULL, ''),
(50, 2234, 'BEN ZID', 'MOHAMED', 'Celibataire', 'Homme', '1995-05-16', NULL, 'AWLED ALI BEL HENI SIDI LHENI SOUSSE, SIDI LHENI', 12809609, NULL, NULL, NULL, ''),
(51, 2535, 'KECHICHE', 'FATEN', 'M', 'F', '1996-08-24', NULL, 'RUE KHORTOUM, Msaken 4070', 12826205, '24994978', NULL, NULL, ''),
(52, 2390, 'BEN ARBIA', 'BEDIS', 'Celibataire', 'H', '1998-01-29', NULL, 'RUE SFAX, Msaken 4070', 12842575, '55760397', NULL, NULL, ''),
(53, 2351, 'KOUADA', 'MOHAMED DHIA', 'Celibataire', 'H', '1998-11-18', NULL, '25 RUE ELWIFEK, Msaken 4070', 12843490, '58669115', NULL, NULL, ''),
(54, 2259, 'SAIEB', 'ACHRAF', 'Celibataire', 'H', '1997-02-17', NULL, 'RUE FARHAT HACHED, Msaken 4070', 12832844, '20602232', NULL, NULL, ''),
(55, 2326, 'GAZZEH', 'KHAIREDDINE', 'M', 'H', '1998-08-04', NULL, 'RUE AMAL, Msaken 4070', 12832299, '54311077', NULL, NULL, ''),
(56, 2266, 'AJROUD', 'YOUSSEF', 'Celibataire', 'H', '1995-01-10', NULL, 'RUE NOUR, Msaken 4070', 9345326, '52740330', NULL, NULL, ''),
(57, 2442, 'BEN ABDALLAH', 'AMEUR', 'M', 'H', '1969-01-01', NULL, 'AWLED MRABET KROUSSIA, SIDI ELHENI', 5511224, '22794454', NULL, NULL, ''),
(58, 2397, 'AZAIEZ', 'MOHAMED', 'M', 'H', '1988-02-11', NULL, 'RUE SIDI AABAR, Msaken 4070', 9258864, '27702202', NULL, NULL, ''),
(59, 2380, 'LOGHMARI', 'ACHRAF', 'Celibataire', 'H', '1996-07-28', NULL, '51 RUE AZIZA OTHMENA, Msaken 4070', 12818073, '52461958', NULL, NULL, ''),
(60, 2402, 'MAKHLOUF', 'FADIA', 'M', 'F', '1984-05-08', NULL, 'RUE 1ER JUIN ZANKET NAKHIL, Msaken 4070', 9256632, '98793797', NULL, NULL, ''),
(61, 2592, 'BEN FREDJ', 'IMENE', 'M', 'F', '1980-11-10', NULL, '108 RUE ALMISSISSIBI, HAY RIADH SOUSSE', 5594223, '94035098', NULL, NULL, ''),
(62, 2283, 'BOUHLEL', 'HAMZA', 'Celibataire', 'H', '1997-03-12', NULL, '317 RUE FARHAT HACHED, Msaken 4070', 12815368, '24376115', NULL, NULL, ''),
(63, 2325, 'BEN CHOUAIB', 'ILYES', 'Celibataire', 'H', '1997-08-04', NULL, 'ALHAY ALJADID, BENI KALTHOUM', 12841115, '50888053', NULL, NULL, ''),
(64, 2180, 'BABAY', 'MOHAMED', 'M', 'H', '1993-05-20', NULL, '153 Rue Farhat Hached, Msaken 4070', 9322164, '23317820', NULL, NULL, ''),
(65, 2181, 'MOUSSA', 'ABDELHAFIDH', 'M', 'H', NULL, NULL, '153 Rue Farhat Hached, Msaken 4070', 9322164, '21536945', NULL, NULL, ''),
(66, 2408, 'CHAIEB', 'HAMDI', 'M', 'H', '1990-06-13', NULL, '14 RUE ALSOUROUR, MSAKEN 4070', 9298000, '96541043', NULL, NULL, ''),
(67, 2456, 'CHAARANA', 'SAMI', 'Celibataire', 'H', '1990-11-22', NULL, '103 RUE FARHAT HACHED, Msaken 4070', 9301527, '27172820', NULL, NULL, ''),
(68, 2497, 'BEN ABDELJELIL', 'WISSEM', 'M', 'H', '1993-03-08', NULL, 'RUE BIR MAKIA, Msaken 4070', 9316568, '53930803', NULL, NULL, ''),
(69, 2572, 'ZAIEG', 'MOHAMED ALI', 'M', 'H', '1995-05-26', NULL, 'RUE BIZERT, Msaken 4070', 12810268, '21011663', NULL, NULL, ''),
(70, 2579, 'BEN HAMMOUDA', 'MOHAMED ACHRAF', 'M', 'H', '1990-07-29', NULL, 'RUE SARIACH, Msaken 4070', 9296518, '21563438', NULL, NULL, ''),
(71, 2569, 'MKHININI', 'WASSIM', 'M', 'H', '1993-08-14', NULL, '36 RUE AMMAN, Msaken 4070', 9321405, '21797903', NULL, NULL, ''),
(72, 2631, 'KHOCHTALI', 'JIHENE', 'M', 'F', '1996-09-04', NULL, 'RUE TAHER SAFAR, Kalaa Kebira', 12825639, '53785704', NULL, NULL, ''),
(73, 2330, 'BEN ARBIA', 'HAMDI', 'Celibataire', 'H', '1995-10-13', NULL, 'RUE HABIB CHATTI, Msaken 4070', 12808458, '27352301', NULL, NULL, ''),
(74, 2516, 'HAMILA', 'Chokri', 'Celibataire', 'H', '1994-05-05', NULL, 'RUE FARHAT HACHED, Msaken 4070', 9331918, '54095617', NULL, NULL, ''),
(75, 2017, 'LAHDHIRI', 'ALI', 'M', 'H', '1993-07-01', NULL, 'Rue Chikh Ladheri, Msaken 4070', 9343792, '21795157', NULL, NULL, ''),
(76, 2521, 'KECHICHE', 'MOHAMED NIDHAL', 'M', 'H', '1990-04-01', NULL, 'RUE HABIB THAMEUR, Msaken 4070', 9285597, '55990864', NULL, NULL, ''),
(77, 2414, 'MAHJOUB', 'GHASSEN', 'Celibataire', 'H', '2000-05-06', NULL, 'Rue Chikh Ladheri, Msaken 4070', 12865562, '22076899', NULL, NULL, ''),
(78, 2203, 'ELGARES', 'MOHAMED WASSIM', 'M', 'H', '1996-06-14', NULL, 'RUE ABDELKARIM KHATTABI, Msaken 4070', 12806399, '28113239', NULL, NULL, ''),
(79, 2392, 'HELLAL', 'KARIM', 'Celibataire', 'H', '1997-07-25', NULL, 'RUE YESSER HARAFET SAHLOUL, SOUSSE', 12838923, '55266495', NULL, NULL, ''),
(80, 2483, 'SRIDI', 'IDRISS', 'Celibataire', 'H', '1997-02-01', NULL, '433 RUE 1ER JUIN, Msaken 4070', 12821361, '52554755', NULL, NULL, ''),
(81, 2511, 'BEN ABDELHAMID', 'AHMED', 'Celibataire', 'H', '1997-07-11', NULL, 'Rue Imem Malek, Messadine 4013', 12845042, '27860527', NULL, NULL, ''),
(82, 2515, 'BEN CHIKH AMOR', 'ZIED', 'M', 'H', '1992-09-10', NULL, 'RUE MOEZ BEN BEDISS, Msaken 4070', 9303038, '20948193', NULL, NULL, ''),
(83, 2517, 'BEN CHIKH AMOR', 'TAREK', 'M', 'H', '1988-11-01', NULL, '30 RUE FARHAT HACHED, Msaken 4070', 9282172, '27448230', NULL, NULL, ''),
(84, 2525, 'MKHININI', 'HAITHAM', 'M', 'H', '1998-04-07', NULL, 'RUE AMINE ABDELKADER JAZAIRI, Msaken 4070', 12841757, '56700132', NULL, NULL, ''),
(85, 2526, 'MLAYAH', 'MOHAMED ALI', 'M', 'H', '1996-09-23', NULL, 'RUE 1ER JUIN, MSAKEN 4070', 12808954, '98783204', NULL, NULL, ''),
(86, 2536, 'MKHININI', 'MOHAMED IHEB', 'M', 'H', '1995-02-08', NULL, '02 RUE ALI DOUAJI, MSAKEN 4070', 12805411, '98793843', NULL, NULL, ''),
(87, 2306, 'BEN HADJ SGHAIER', 'WAJIH', 'Celibataire', 'H', '1999-10-18', NULL, '84 RUE ISTEKLEL, Msaken 4070', 12851621, '29207380', NULL, NULL, ''),
(88, 2212, 'MKHININI', 'Hazem', 'M', 'H', '1997-05-18', NULL, 'Rue Ali Ibn Abi Taleb, Msaken 4070', 12817909, NULL, NULL, NULL, ''),
(89, 2286, 'BEN HADJ FREDJ', 'BAYREM', 'Celibataire', 'H', '1996-07-21', NULL, 'BENI KALTHOUM, Msaken 4070', 12831869, '29019007', NULL, NULL, ''),
(90, 2404, 'BEN AMARA', 'YASMINE', 'Celibataire', 'F', '1998-12-06', NULL, '470RUE HATEM ETTAI, SOUSSE', 12837514, '98793776', NULL, NULL, ''),
(91, 2427, 'HAMOUDA', 'AHMED', 'Celibataire', 'H', '2000-06-12', NULL, '729 RUE KSAR HELAL, ZOUHOUR SOUSSE', 12865433, '99112657', NULL, NULL, ''),
(92, 2444, 'MAOUA', 'HATEM', 'M', 'H', '1991-08-24', NULL, 'RUE KARBALA, Msaken 4070', 9322625, '98793594', NULL, NULL, ''),
(93, 2565, 'GRAIET', 'ALI', 'Celibataire', 'H', '2000-12-17', NULL, '107 RUE FARHAT HACHED, Msaken 4070', 12855151, '2718977', NULL, NULL, ''),
(94, 2595, 'BEN ABDESSALEM', 'WASSIM', 'Celibataire', 'H', '1998-12-08', NULL, 'RUE SIDI AABAR, Msaken 4070', 12808652, '28622537', NULL, NULL, ''),
(95, 2640, 'TOUINSI MAHJOUB', 'MAJDI', 'Celibataire', 'H', '1991-05-05', NULL, '113 RUE MONJI ZREBI, Msaken 4070', 9291514, '21858688', NULL, NULL, ''),
(96, 2366, 'KANTAOUI', 'TAHANI', 'Celibataire', 'F', '1987-07-20', NULL, 'N°2 RUE BOULARIGIA, HAMMAM SOUSSE', 9289244, '98793580', NULL, NULL, ''),
(97, 2422, 'CHAALALI', 'FAKHER', 'Celibataire', 'H', '1996-12-23', NULL, 'CHAALILE BORGINE, BORGINE', 12833211, '22330761', NULL, NULL, ''),
(98, 2486, 'ZAGGAR', 'YASSINE', 'Celibataire', 'H', '1999-06-25', NULL, 'RUE ITTEHAD SAKBOUNA, Msaken 4070', 12865833, '56666582', NULL, NULL, ''),
(99, 2593, 'MAHJOUB', 'OMAR', 'Celibataire', 'H', '1996-10-17', NULL, 'RUE DOUALI, Msaken 4070', 12830947, '93427297', NULL, NULL, ''),
(100, 2633, 'GUIRAT', 'FIRAS', 'M', 'H', '1997-06-29', NULL, 'RUE HAMMAM CHAT HAY NOUR, Msaken 4070', 12811447, '29290960', NULL, NULL, ''),
(101, 2504, 'ROUIS', 'MOHAMED AZIZ', 'Celibataire', 'H', '2000-03-11', NULL, 'TRIK KNAIES, Knaies 4014', 12860431, '93871988', NULL, NULL, ''),
(102, 2537, 'YOUSSEF', 'WAFA', 'Celibataire', 'F', '1996-09-18', NULL, '35 RUE KHAIZOURANE CITE TAAMIR, SOUSSE', 12824456, '96689057', NULL, NULL, ''),
(103, 2539, 'BOUZAMOUCHA', 'IHEB', 'Celibataire', 'H', '1996-07-03', NULL, 'HAY JADID, Msaken 4070', 12824227, '98793786', NULL, NULL, ''),
(104, 2544, 'ROMDHANE', 'BAHA EDDINE', 'Celibataire', 'H', '1996-09-19', NULL, 'RUE 20 MARS, Msaken 4070', 12827375, '29018771', NULL, NULL, ''),
(105, 2582, 'BEN ABDALLAH', 'MALAK', 'Celibataire', 'H', '2001-06-27', NULL, 'RUE ZOUHOUR, Msaken 4070', 12872621, '25722677', NULL, NULL, ''),
(106, 2596, 'LAAZIBI', 'YASSINE', 'Celibataire', 'H', '1995-07-31', NULL, 'RUE RKEB, Msaken 4070', 9344638, '98793706', NULL, NULL, ''),
(107, 2637, 'ALOUEN', 'FAOUZI', 'M', 'H', '1995-08-29', NULL, 'RUE ABDELKADER JAZAIRI, Msaken 4070', 9346084, '96310010', NULL, NULL, ''),
(108, 2659, 'MOSBAH', 'MOHAMED SALAH', 'Celibataire', 'H', '1994-04-04', NULL, 'RUE IMEM IBN HANBAL, Msaken 4070', 9339714, '29054966', NULL, NULL, ''),
(109, 2337, 'MOSBAH', 'MOHAMED', 'M', 'H', '1993-09-15', NULL, '21 RUE 9 AVRIL, Msaken 4070', 9341284, '53293770', NULL, NULL, ''),
(110, 2339, 'KHAIREDDINE', 'HAMZA', 'Celibataire', 'H', '1995-06-30', NULL, 'BOUTCHICHA SARIECH', 12811295, '27341391', NULL, NULL, ''),
(111, 2350, 'LOGHMARI', 'ANOUAR', 'Celibataire', 'H', '1998-01-03', NULL, '51 RUE AZIZA OTHMANA, Msaken 4070', 12819440, '21259254', NULL, NULL, ''),
(112, 2519, 'FEKIH ALI', 'MOHAMED ANIS', 'M', 'H', '1986-01-27', NULL, 'RUE IBN SINA MESSADINE, SOUSSE', 9268494, '52220931', NULL, NULL, ''),
(113, 2542, 'ZANINA', 'FIRAS', 'Celibataire', 'H', '1997-10-22', NULL, 'SAHLOUL 4, SOUSSE', 7487482, '98793507', NULL, NULL, ''),
(114, 2630, 'FTOUHI', 'JASSER', 'Celibataire', 'H', '1996-11-30', NULL, 'MASJED ISSA SAHLINE, MONASTIR', 6979491, '56384044', NULL, NULL, ''),
(115, 2658, 'MANSOUR', 'CHAKER', 'M', 'H', '1988-03-09', NULL, 'BENI RABIAA, Msaken 4070', 9270476, '98793741', NULL, NULL, ''),
(116, 2538, 'CHAIEB', 'HOUSSEM EDDINE', 'Celibataire', 'H', '1996-06-21', NULL, 'RUE BEN GHAZI, Msaken 4070', 12827179, '98793849', NULL, NULL, ''),
(117, 2300, 'NASIB', 'KAIS', 'Celibataire', 'H', '1986-09-29', NULL, 'Rue Khaled Ibn Walid, MSAKEN 4070', 9306666, '54143127', NULL, NULL, ''),
(118, 2465, 'BOUARGOUB', 'YASSER', 'Celibataire', 'H', '2004-01-08', NULL, 'RUE Chahid Ahmed Rkik, MSAKEN 4070', 12892804, '27022184', NULL, NULL, ''),
(119, 2473, 'BEN ABDESSALEM', 'MOHAMED', 'M', 'H', '1986-10-23', NULL, 'RUE ZAMZAM, MSAKEN 4070', 9257073, '21800308', NULL, NULL, ''),
(120, 2479, 'BEN ABDALLAH', 'KHALED', 'M', 'H', '1996-06-13', NULL, 'FRADA, MSAKEN 4070', 12829092, '92369116', NULL, NULL, ''),
(121, 2520, 'HAMMED', 'AYOUB', 'M', 'H', '1988-01-11', NULL, 'RUE SIDI AABAR, Msaken 4070', 9262375, '27322277', NULL, NULL, ''),
(122, 2557, 'SLAMA', 'MEHDI', 'Celibataire', 'H', '1999-04-03', NULL, 'BOURGINE, Msaken 4070', 12842687, '99788830', NULL, NULL, ''),
(123, 2621, 'MBARKI', 'HOSNI', 'Celibataire', 'H', '1999-03-15', NULL, 'HAJEB LAYOUN, KAIROUAN', 11971675, '98140252', NULL, NULL, ''),
(124, 2466, 'SOUA', 'AHMED', 'Celibataire', 'H', '2002-01-19', NULL, 'RUE AGHADIR, Msaken 4070', 12886545, '29851495', NULL, NULL, ''),
(125, 2509, 'KHEDHIRI', 'MOHAMED', 'Celibataire', 'H', '1933-01-01', NULL, 'RUE 1ER JUIN, Msaken 4070', 9324428, '52524549', NULL, NULL, ''),
(126, 2549, 'LAMIRI', 'FIRAS', 'Celibataire', 'H', '2000-04-04', NULL, 'RUE MOHAMED ALI, Msaken 4070', 12861756, '28504207', NULL, NULL, ''),
(127, 2589, 'GAIECH', 'FIRAS', 'Celibataire', 'H', '1995-10-17', NULL, '47 RUE SIDI ABAR, Msaken 4070', 12841006, '50371488', NULL, NULL, ''),
(128, 2714, 'MAJDOUB', 'MAJDI', 'Celibataire', 'H', '1984-08-10', NULL, '9 RUE ELHOUDA, Msaken 4070', 8445220, '24027700', NULL, NULL, ''),
(129, 2376, 'JARRAR', 'KHALED', 'M', 'H', '1998-07-30', NULL, 'RUE HEDI CHAKER, Msaken 4070', 12848660, '98793636', NULL, NULL, ''),
(130, 2482, 'BEN MARIEM', 'OTHMEN', 'M', 'H', '1996-04-01', NULL, 'RUE MONJI ZRIBI, Msaken 4070', 12818464, '25508230', NULL, NULL, ''),
(131, 2406, 'YOUSSEF', 'GHASSEN', 'Celibataire', 'H', '1988-10-10', NULL, 'ROUTE KNAIES, Msaken 4070', 9257625, '98793880', NULL, NULL, ''),
(132, 2527, 'KADRI', 'NIZAR', 'M', 'H', '1994-06-09', NULL, 'RUE ABOU MOUSSA AL ACHRARI, Msaken 4070', 12807926, '98180562', NULL, NULL, ''),
(133, 2575, 'KARMOUS', 'YASSINE', 'Celibataire', 'H', '2001-03-28', NULL, 'RUE AHMED BAYREM, Msaken 4070', 12876418, '21355718', NULL, NULL, ''),
(134, 2632, 'BHIRI', 'MAROUAN', 'Celibataire', 'H', '1989-11-22', NULL, '73 RUE IMEM BEN ARAFA, Msaken 4070', 9282876, '98793748', NULL, NULL, ''),
(135, 2671, 'MANSOURI', 'MOHAMED', 'M', 'H', '1991-04-26', NULL, '10 RUE AL KODS, Msaken 4070', 9309277, '55052225', NULL, NULL, ''),
(136, 2767, 'REJAB', 'SARRA', 'M', 'F', '1995-12-25', NULL, 'RUE 18 JANVIER, HAMMAM SOUSSE', 6974634, '50754093', NULL, NULL, ''),
(137, 2324, 'CHTIOUI', 'MOHAMED HABIB', 'Celibataire', 'H', '1988-10-13', NULL, 'RUE 18 JANVIER, Msaken 4070', 9287175, '53218485', NULL, NULL, ''),
(138, 2468, 'ZAIEG', 'IBRAHIM', 'M', 'H', '1998-06-07', NULL, 'RUE BIZERTE, Msaken 4070', 12842530, '98123541', NULL, NULL, ''),
(139, 2503, 'GAALOUL', 'SAHAR', 'Celibataire', 'F', '1999-05-13', NULL, '63 RUE SALEH HAFSA, Msaken 4070', 12856831, '53274307', NULL, NULL, ''),
(140, 2505, 'FAYALA', 'OTHMEN', 'Celibataire', 'H', '1997-01-23', NULL, 'BORJINE, Msaken 4070', 12824031, '21106745', NULL, NULL, ''),
(141, 2568, 'MASSIOUGHA', 'MOHAMED AMINE', 'M', 'H', '1991-06-13', NULL, 'RUE KARBALA HAY NOUR, Msaken 4070', 9289323, '23400985', NULL, NULL, ''),
(142, 2464, 'ACHECH', 'MOHAMED AMINE', 'M', 'H', '1999-11-19', NULL, 'Rue Imem Malek, Msaken 4070', 12864268, '27216389', NULL, NULL, ''),
(143, 2530, 'SOUA', 'AHMED', 'Celibataire', 'H', '1993-02-28', NULL, 'RUE SAFA, Msaken 4070', 9321059, '55308722', NULL, NULL, ''),
(144, 1939, 'EL YAZIDI', 'DRISS', 'M', 'H', '1969-09-27', NULL, '92 Knaies, Knaies 4014', 5528407, NULL, NULL, NULL, ''),
(145, 2453, 'SABBEGH', 'FIRAS', 'M', 'H', '1997-07-09', NULL, '5 RUE INDIPENDANCE, MSAKEN 4070', 12829076, '55042870', NULL, NULL, ''),
(146, 2713, 'CHATTI', 'SALEM', 'Celibataire', 'H', '1994-02-23', NULL, 'RUE FARHAT HACHED, MSAKEN 4070', 9347705, '92893800', NULL, NULL, ''),
(147, 2774, 'BOUGUILA', 'SALIMA', 'M', 'H', '1995-02-06', NULL, '02 RUE LAAROUSSI ZAROUK, SOUSSE', 12808858, '28702615', NULL, NULL, ''),
(148, 2773, 'BEN HADJ ALI', 'YASSINE', 'M', 'H', '1990-05-09', NULL, 'AWLED AMOR, SIDI ELHENI', 9294963, '47141950', NULL, NULL, '');

-- --------------------------------------------------------

--
-- Structure de la table `bordereau`
--

CREATE TABLE `bordereau` (
  `id_bordereau` int(11) NOT NULL,
  `id_bulletin` int(11) NOT NULL,
  `numero_bordereau` int(11) NOT NULL,
  `date_envoi` date DEFAULT NULL,
  `statut` varchar(50) DEFAULT NULL,
  `commentaire` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bulletin_soin`
--

CREATE TABLE `bulletin_soin` (
  `id_bulletin` int(11) NOT NULL,
  `id_adherent` int(11) NOT NULL,
  `id_sous_adherent` int(11) DEFAULT NULL,
  `numero_bordereau` int(11) NOT NULL DEFAULT 0,
  `numero_bulletin` int(11) NOT NULL,
  `date_soin` date DEFAULT NULL,
  `montant_depense` decimal(10,2) DEFAULT NULL,
  `type_soin` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `etat` varchar(50) DEFAULT 'En attente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bulletin_soin_detail`
--

CREATE TABLE `bulletin_soin_detail` (
  `id_detail` int(11) NOT NULL,
  `id_bulletin` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `montant` decimal(10,2) DEFAULT 0.00,
  `ordonnance` tinyint(1) DEFAULT 0,
  `type_soin` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `sous_adherent`
--

CREATE TABLE `sous_adherent` (
  `id_sous_adherent` int(11) NOT NULL,
  `id_adherent` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `sexe` varchar(20) DEFAULT NULL,
  `lien_parente` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `sous_adherent`
--

INSERT INTO `sous_adherent` (`id_sous_adherent`, `id_adherent`, `nom`, `prenom`, `date_naissance`, `sexe`, `lien_parente`) VALUES
(1, 1, 'BEN MOHAMED', 'JAMILA', '1975-01-18', 'F', 'Conjoint'),
(2, 1, 'BEN HMED', 'JIHED', '1999-02-02', 'H', 'Enfant'),
(3, 1, 'BEN HMED', 'SAIFEDDINE', '2003-11-13', 'H', 'Enfant'),
(4, 1, 'BEN HMED', 'SARRA', '2010-09-09', 'F', 'Enfant'),
(5, 2, 'KAHLOUL', 'RATIBA', '1973-05-06', 'F', 'Conjoint'),
(6, 2, 'NOUIRA', 'NADA', '1997-12-19', 'F', 'Enfant'),
(7, 2, 'NOUIRA', 'HACHEM', '2007-01-21', 'H', 'Enfant'),
(8, 2, 'NOUIRA', 'HAMZA', '2007-01-21', 'H', 'Enfant'),
(9, 3, 'MARIEM', 'RIHAB', '1990-07-26', 'F', 'Conjoint'),
(10, 4, 'BEN MBAREK', 'RIM', '1980-03-05', 'F', 'Conjoint'),
(11, 4, 'HADJ AMMAR', 'KARIM', '2002-06-21', 'H', 'Enfant'),
(12, 4, 'HADJ AMMAR', 'YASSER', '2005-05-17', 'H', 'Enfant'),
(13, 4, 'HADJ AMMAR', 'SARRA', '2014-01-14', 'F', 'Enfant'),
(14, 5, 'BADER', 'SONIA', '1992-11-04', 'F', 'Conjoint'),
(15, 5, 'MOHAMED', 'ZAKARIA', '2020-04-02', 'H', 'Enfant'),
(16, 5, 'MOHAMED', 'IBRAHIM', '2023-07-23', 'H', 'Enfant'),
(17, 6, 'LILI', 'NOURHENE', '1990-12-11', 'F', 'Conjoint'),
(18, 6, 'BOUARGOUB', 'TALINE', '2019-05-22', 'F', 'Enfant'),
(19, 6, 'BOUARGOUB', 'NADINE', '2021-08-17', 'F', 'Enfant'),
(20, 7, 'SAKHANA', 'HAJER', '1976-05-08', 'F', 'Conjoint'),
(21, 7, 'MNED', 'OUSSEMA', '2002-08-07', 'H', 'Enfant'),
(22, 7, 'MNED', 'OUMAIMA', '2004-12-23', 'F', 'Enfant'),
(23, 7, 'MNED', 'AYMEN', '2006-11-30', 'H', 'Enfant'),
(24, 7, 'MNED', 'ASMA', '2013-02-01', 'F', 'Enfant'),
(25, 9, 'JEBALI', 'IMENE', '1986-10-30', 'F', 'Conjoint'),
(26, 9, 'BOUKADIDA', 'TAYSIR', '2007-07-16', 'H', 'Enfant'),
(27, 9, 'BOUKADIDA', 'ABDERRAHMENE', '2009-03-01', 'H', 'Enfant'),
(28, 9, 'BOUKADIDA', 'NESRINE', '2012-08-12', 'F', 'Enfant'),
(29, 11, 'ZAMMIT CHATTI', 'RANIA', '1996-08-29', 'F', 'Conjoint'),
(30, 12, 'AL EBDELLI', 'MERIAM', '1996-02-04', 'F', 'Conjoint'),
(31, 12, 'HEDHILI', 'AHMED', '2024-12-30', 'H', 'Enfant'),
(32, 13, 'BEN AMARA', 'HELA', '1996-04-12', 'F', 'Conjoint'),
(33, 13, 'HAMIDA', 'IBRAHIM', '2018-08-08', 'H', 'Enfant'),
(34, 13, 'HAMIDA', 'BAIRAM', '2022-08-08', 'H', 'Enfant'),
(35, 14, 'ATROUS', 'SOUHA', '1994-07-08', 'F', 'Conjoint'),
(36, 14, 'JERFEL', 'HAROUN', '2022-05-23', 'H', 'Enfant'),
(37, 15, 'DAHMOUL', 'MARIEM', '2004-08-27', 'F', 'Conjoint'),
(38, 15, 'BOUHLEL', 'OMAR', '2023-10-14', 'H', 'Enfant'),
(39, 16, 'HAMILA', 'OLFA', '2003-10-26', 'F', 'Conjoint'),
(40, 16, 'JARRAR', 'RANIA', '2025-01-21', 'F', 'Enfant'),
(41, 16, 'JARRAR', 'KMAR', '2026-06-03', 'F', 'Enfant'),
(42, 17, 'ABDALLAH', 'HOUDA', '2001-02-23', 'F', 'Conjoint'),
(43, 19, 'RAGOUBI', 'FARAH', '1998-03-08', 'F', 'Conjoint'),
(44, 19, 'BELKHIRIA', 'LINA', '2020-07-25', 'F', 'Enfant'),
(45, 19, 'BELKHIRIA', 'RAYHAN', '2023-04-12', 'F', 'Enfant'),
(46, 20, 'ELMILLICHI', 'ZAIENEB', '2000-04-29', 'F', 'Conjoint'),
(47, 20, 'BERRIRI', 'MAYAR', '2022-06-22', 'F', 'Enfant'),
(48, 20, 'BERRIRI', 'ELINE', '2026-01-12', 'F', 'Enfant'),
(49, 21, 'BEN BRAHIM', 'MAROUA', '1991-07-17', 'F', 'Conjoint'),
(50, 21, 'BEN HADJ HASSINE', 'LOUAI', '2014-07-04', 'H', 'Enfant'),
(51, 21, 'BEN HADJ HASSINE', 'IYED', '2016-10-22', 'H', 'Enfant'),
(52, 24, 'REJEB', 'LAMIA', '1982-05-06', 'F', 'Conjoint'),
(53, 24, 'HMIDI', 'HAZEM', '2002-05-20', 'H', 'Enfant'),
(54, 24, 'HMIDI', 'MOHANNED', '2004-07-21', 'H', 'Enfant'),
(55, 24, 'HMIDI', 'YAHIA', '2012-02-10', 'H', 'Enfant'),
(56, 25, 'BEN SAID', 'ABIR', '1992-05-27', 'F', 'Conjoint'),
(57, 25, 'BEN HADJ HASSINE', 'YOUSSEF', '2025-10-04', 'H', 'Enfant'),
(58, 31, 'CHATTI', 'SARRA', '1994-02-12', 'F', 'Conjoint'),
(59, 31, 'BEL HADJ JRAD', 'ABDERRAHMENE', '2020-08-07', 'H', 'Enfant'),
(60, 31, 'BEL HADJ JRAD', 'MAYSEN', '2022-11-02', 'F', 'Enfant'),
(61, 32, 'JEBALI', 'SABRINE', '1998-04-30', 'F', 'Conjoint'),
(62, 32, 'BOUARGOUB', 'NAJMEDDINE', '2021-12-27', 'H', 'Enfant'),
(63, 35, 'BEN SALEM', 'MAHA', '1993-11-28', 'F', 'Conjoint'),
(64, 35, 'JARRAR', 'JED', '2022-05-13', 'H', 'Enfant'),
(65, 35, 'JARRAR', 'ZAYD', '2026-03-07', 'H', 'Enfant'),
(66, 36, 'BEN SLIMEN', 'GHOZLEN', '2000-07-12', 'F', 'Conjoint'),
(67, 36, 'BEN AHMED', 'MOHAMED', '2025-05-31', 'H', 'Enfant'),
(68, 38, 'BEN ABDELJELIL', 'NAJOUA', '1969-02-13', 'F', 'Conjoint'),
(69, 38, 'BEN ABDELJELIL', 'ASMA', '2007-01-05', 'F', 'Enfant'),
(70, 38, 'BEN ABDELJELIL', 'IBTISSEM', '1997-02-16', 'F', 'Enfant'),
(71, 38, 'BEN ABDELJELIL', 'RIHAB', '1998-04-19', 'F', 'Enfant'),
(72, 39, 'HADDAD', 'LATIFA', '1981-06-21', 'F', 'Conjoint'),
(73, 39, 'HADJ ABDALLAH', 'AHMED', '2009-08-18', 'H', 'Enfant'),
(74, 39, 'HADJ ABDALLAH', 'ABIR', '2012-02-28', 'F', 'Enfant'),
(75, 39, 'HADJ ABDALLAH', 'ABDERRAHMENE', '2016-03-07', 'H', 'Enfant'),
(76, 40, 'NOUIRA', 'RYM', '1988-12-27', 'F', 'Conjoint'),
(77, 40, 'JEBALI', 'MARIEM', '2013-10-23', 'F', 'Enfant'),
(78, 40, 'JEBALI', 'MARAM', '2015-07-30', 'F', 'Enfant'),
(79, 40, 'JEBALI', 'AHMED', '2023-01-04', 'H', 'Enfant'),
(80, 43, 'SALLEM', 'NOUR ELHOUDA', '1998-09-23', 'F', 'Conjoint'),
(81, 43, 'ELGHAOUI', 'MELISSA', '2024-10-13', 'F', 'Enfant'),
(82, 46, 'BEN KHEDHER', 'CHEMA', '2000-10-19', 'F', 'Conjoint'),
(83, 49, 'BOUSOBINE', 'YASMINE', '1993-03-04', 'F', 'Conjoint'),
(84, 49, 'BRIKI', 'JOULIA', '2019-06-21', 'F', 'Enfant'),
(85, 49, 'BRIKI', 'JOMANA', '2023-01-31', 'F', 'Enfant'),
(86, 51, 'ZANINA', 'HOUCEM', '1991-01-24', 'H', 'Conjoint'),
(87, 51, 'ZANINA', 'AYOUB', '2023-04-01', 'H', 'Enfant'),
(88, 51, 'ZANINA', 'ZAKARIA', '2025-08-22', 'H', 'Enfant'),
(89, 55, 'BEN HAMIDA', 'AMEL', '1997-04-15', 'F', 'Conjoint'),
(90, 55, 'GAZZEH', 'ISSA', '2023-07-15', 'H', 'Enfant'),
(91, 57, 'BEN YENES', 'ZAHRA', '1982-01-24', 'F', 'Conjoint'),
(92, 57, 'BEN ABDALLAH', 'RAWAL', '2011-07-13', 'F', 'Enfant'),
(93, 57, 'BEN ABDALLAH', 'MOHAMED', '2014-11-07', 'H', 'Enfant'),
(94, 57, 'BEN ABDALLAH', 'RANIA', '2018-01-05', 'F', 'Enfant'),
(95, 57, 'BEN ABDALLAH', 'RAWAND', '2019-05-07', 'F', 'Enfant'),
(96, 58, 'MDALLA', 'SIWAR', '1993-07-09', 'F', 'Conjoint'),
(97, 58, 'AZAIEZ', 'YAZEN', '2023-12-15', 'H', 'Enfant'),
(98, 60, 'KECHICHE', 'AHMED', '1984-04-07', 'H', 'Conjoint'),
(99, 60, 'KECHICHE', 'MARIEM', '2015-03-23', 'F', 'Enfant'),
(100, 60, 'KECHICHE', 'SOULAIMA', '2020-01-28', 'F', 'Enfant'),
(101, 60, 'KECHICHE', 'RACHIDA SARRA', '2022-11-10', 'F', 'Enfant'),
(102, 61, 'HADJ AMOR', 'NABIL', '1978-12-02', 'H', 'Conjoint'),
(103, 61, 'HADJ AMOR', 'YOUSSEF', '2014-11-14', 'H', 'Enfant'),
(104, 61, 'HADJ AMOR', 'SALIMA', '2016-10-11', 'F', 'Enfant'),
(105, 64, 'SAKKA ROUIS', 'MALAK', '1995-09-17', 'F', 'Conjoint'),
(106, 64, 'BABAY', 'OMAR', '2023-09-07', 'H', 'Enfant'),
(107, 65, 'BOUHLEL', 'RIHAB', '1993-11-08', 'F', 'Conjoint'),
(108, 65, 'MOUSSA', 'TAYSIR', '2015-01-09', 'H', 'Enfant'),
(109, 65, 'MOUSSA', 'ABDERRAHMENE', '2015-12-11', 'H', 'Enfant'),
(110, 65, 'MOUSSA', 'MOHAMED HABIB', '2022-04-17', 'H', 'Enfant'),
(111, 66, 'BOUHLEL', 'MOUNA', '1996-10-16', 'F', 'Conjoint'),
(112, 66, 'CHAIEB', 'ABDERRAHMENE', '2017-01-24', 'H', 'Enfant'),
(113, 66, 'CHAIEB', 'BADER', '2021-06-29', 'H', 'Enfant'),
(114, 66, 'CHAIEB', 'BARAA', '2023-10-15', 'H', 'Enfant'),
(115, 68, 'GAALOUL', 'NADA', '1992-10-03', 'F', 'Conjoint'),
(116, 68, 'BEN ABDELJELIL', 'LOUJAINE', '2026-02-20', 'F', 'Enfant'),
(117, 69, 'SRIDI', 'ISLEM', '2002-07-19', 'F', 'Conjoint'),
(118, 69, 'ZAIEG', 'NOAH', '2023-08-04', 'H', 'Enfant'),
(119, 69, 'ZAIEG', 'KAMAR', '2025-06-18', 'F', 'Enfant'),
(120, 70, 'HAMILA', 'SAWSSAN', '1994-09-21', 'F', 'Conjoint'),
(121, 70, 'BEN HAMMOUDA', 'MOHAMED IHEB', '2019-01-31', 'H', 'Enfant'),
(122, 70, 'BEN HAMMOUDA', 'YASMINE', '2021-04-12', 'F', 'Enfant'),
(123, 71, 'MRIBEH', 'RIHAB', '1998-11-07', 'F', 'Conjoint'),
(124, 71, 'MKHININI', 'MOHAMED OUAIS', '2024-10-27', 'H', 'Enfant'),
(125, 72, 'GADOUAR', 'MOHAMED SALAH', '1992-02-23', 'H', 'Conjoint'),
(126, 72, 'GADOUAR', 'MOHAMED AYEN', '2025-03-07', 'H', 'Enfant'),
(127, 75, 'LOGHLANI', 'ALAMRIA', '1990-11-18', 'F', 'Conjoint'),
(128, 76, 'ALOUEN', 'SAWSSAN', '2000-09-12', 'F', 'Conjoint'),
(129, 76, 'KECHICHE', 'KENZA', '2023-10-21', 'F', 'Enfant'),
(130, 76, 'KECHICHE', 'ALMA', '2025-10-07', 'F', 'Enfant'),
(131, 78, 'KAIBI', 'ABIR', '1997-04-18', 'F', 'Conjoint'),
(132, 78, 'ELGARES', 'NADINE', '2024-05-19', 'F', 'Enfant'),
(133, 82, 'HOUAS', 'WIEM', '1993-11-28', 'F', 'Conjoint'),
(134, 82, 'BEN CHIKH AMOR', 'LOUJAINE', '2019-02-06', 'F', 'Enfant'),
(135, 82, 'BEN CHIKH AMOR', 'MOHAMED LOUAY', '2020-08-05', 'H', 'Enfant'),
(136, 83, 'ZOURGATI', 'SAFA', '1994-10-10', 'F', 'Conjoint'),
(137, 83, 'BEN CHIKH AMOR', 'NOURSEN', '2018-09-25', 'F', 'Enfant'),
(138, 83, 'BEN CHIKH AMOR', 'YOUSSEF', '2019-11-17', 'H', 'Enfant'),
(139, 84, 'ZALTANI', 'SAMAR', '1999-11-25', 'F', 'Conjoint'),
(140, 84, 'MKHININI', 'MAYAR', '2025-01-19', 'F', 'Enfant'),
(141, 85, 'KHALFALLAH', 'AYA', '2000-04-01', 'F', 'Conjoint'),
(142, 86, 'BEN AICHA', 'ASMA', '1998-07-18', 'F', 'Conjoint'),
(143, 86, 'MKHININI', 'CELINE', '2024-05-24', 'F', 'Enfant'),
(144, 88, 'NAILI', 'MARIEM', '1996-10-03', 'F', 'Conjoint'),
(145, 88, 'MKHININI', 'ILINE', NULL, 'F', 'Enfant'),
(146, 88, 'MKHININI', 'KAOUTHAR', '2025-11-11', 'F', 'Enfant'),
(147, 92, 'LADHARI', 'SONIA INES', '1989-11-14', 'F', 'Conjoint'),
(148, 92, 'MAOUA', 'IYED', '2025-05-28', 'H', 'Enfant'),
(149, 100, 'HACHFI', 'YASMINE', '1997-11-30', 'F', 'Conjoint'),
(150, 100, 'GUIRAT', 'MOHAMED JOUD', '2025-08-27', 'H', 'Enfant'),
(151, 107, 'HEDHILI MAHJOUB', 'NADIA', '1999-07-01', 'F', 'Conjoint'),
(152, 107, 'ALOUEN', 'MOHAMED SOULAIMENE', '2025-01-09', 'H', 'Enfant'),
(153, 108, 'CHATTI', 'YASMINE', NULL, 'F', 'Conjoint'),
(154, 108, 'MOSBAH', 'ZEYD', '2026-05-11', 'H', 'Enfant'),
(155, 109, 'YOUSSEF', 'CHAIMA', '1998-04-24', 'F', 'Conjoint'),
(156, 109, 'MOSBAH', 'ABDERRAHMENE', '2024-10-06', 'H', 'Enfant'),
(157, 112, 'DALI', 'JIHENE', '1994-03-23', 'F', 'Conjoint'),
(158, 112, 'FEKIH ALI', 'FARAH', '2017-08-02', 'F', 'Enfant'),
(159, 112, 'FEKIH ALI', 'MAJED', '2022-06-29', 'H', 'Enfant'),
(160, 115, 'AYARI', 'DHEKRA', '1990-04-06', 'F', 'Conjoint'),
(161, 115, 'MANSOUR', 'YASSINE', '2025-08-08', 'H', 'Enfant'),
(162, 119, 'ALAOUI', 'OUMAIMA', '2006-01-28', 'F', 'Conjoint'),
(163, 119, 'BEN ABDESSALEM', 'SALEM', '2025-12-23', 'H', 'Enfant'),
(164, 120, 'ABDALLAH', 'KHOULOUD', '2002-07-25', 'F', 'Conjoint'),
(165, 120, 'ABDALLAH', 'MOHAMED JOUD', '2025-09-08', 'H', 'Enfant'),
(166, 121, 'SAADANA', 'LOBNA', '1987-07-06', 'F', 'Conjoint'),
(167, 129, 'HDHIRI', 'CHAIMA', '2005-03-01', 'F', 'Conjoint'),
(168, 129, 'JARRAR', 'BAYA', '2026-05-30', 'F', 'Enfant'),
(169, 130, 'GADHI', 'MAYADA', '1996-07-23', 'F', 'Conjoint'),
(170, 132, 'BAYA', 'NOUR', '1998-06-27', 'F', 'Conjoint'),
(171, 135, 'GUEZGUEZ', 'CHIRAZ', '1993-01-28', 'F', 'Conjoint'),
(172, 135, 'MANSOURI', 'YOUSSEF', '2021-07-01', 'H', 'Enfant'),
(173, 135, 'MANSOURI', 'ILYES', '2026-05-05', 'H', 'Enfant'),
(174, 136, 'MHIRI', 'YASSINE', '1992-04-08', 'H', 'Conjoint'),
(175, 136, 'MHIRI', 'KHADIJA', '2025-04-12', 'F', 'Enfant'),
(176, 138, 'AMRI', 'JIHENE', '2003-10-20', 'F', 'Conjoint'),
(177, 141, 'BEN ABDALLAH', 'KHAOULA', '1995-02-12', 'F', 'Conjoint'),
(178, 141, 'MASSIOUGHA', 'YAHIA', '2018-05-23', 'H', 'Enfant'),
(179, 141, 'MASSIOUGHA', 'ISRAA', '2022-07-31', 'F', 'Enfant'),
(180, 142, 'BEN AZIZA', 'BOCHRA', '2001-04-19', 'F', 'Conjoint'),
(181, 144, 'KAMOUN', 'SONDOS', '1977-06-04', 'F', 'Conjoint'),
(182, 144, 'EL YAZIDI', 'AYA', '2011-01-03', 'F', 'Enfant'),
(183, 144, 'EL YAZIDI', 'YAKOUB', '2013-03-13', 'H', 'Enfant'),
(184, 145, 'ELABED', 'ONES', '1999-06-22', 'F', 'Conjoint'),
(185, 147, 'REGAIEG', 'WAFA', '1999-02-02', 'F', 'Conjoint'),
(186, 147, 'BOUGUILA', 'NOUH', '2025-12-05', 'H', 'Enfant'),
(187, 148, 'ALGHABI', 'ZINA', '1996-06-24', 'F', 'Conjoint'),
(188, 148, 'BEN HADJ ALI', 'CHAHD', '2023-08-16', 'F', 'Enfant');

-- --------------------------------------------------------

--
-- Structure de la table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `email` varchar(60) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `email`, `mot_de_passe`) VALUES
(1, 'admin@stip.tn', '$2y$10$uFgjAeCp6ImCwLFBAXki/.OrsEkfgR3MWu6mes2lfFWLhvbU41FT.');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `adherent`
--
ALTER TABLE `adherent`
  ADD PRIMARY KEY (`id_adherent`);

--
-- Index pour la table `bordereau`
--
ALTER TABLE `bordereau`
  ADD PRIMARY KEY (`id_bordereau`),
  ADD UNIQUE KEY `id_bulletin` (`id_bulletin`);

--
-- Index pour la table `bulletin_soin`
--
ALTER TABLE `bulletin_soin`
  ADD PRIMARY KEY (`id_bulletin`),
  ADD KEY `id_adherent` (`id_adherent`),
  ADD KEY `id_sous_adherent` (`id_sous_adherent`);

--
-- Index pour la table `bulletin_soin_detail`
--
ALTER TABLE `bulletin_soin_detail`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_bulletin` (`id_bulletin`);

--
-- Index pour la table `sous_adherent`
--
ALTER TABLE `sous_adherent`
  ADD PRIMARY KEY (`id_sous_adherent`),
  ADD KEY `id_adherent` (`id_adherent`);

--
-- Index pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `tokenable_type_tokenable_id` (`tokenable_type`,`tokenable_id`),
  ADD KEY `expires_at` (`expires_at`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `adherent`
--
ALTER TABLE `adherent`
  MODIFY `id_adherent` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- AUTO_INCREMENT pour la table `bordereau`
--
ALTER TABLE `bordereau`
  MODIFY `id_bordereau` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `bulletin_soin`
--
ALTER TABLE `bulletin_soin`
  MODIFY `id_bulletin` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `bulletin_soin_detail`
--
ALTER TABLE `bulletin_soin_detail`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `sous_adherent`
--
ALTER TABLE `sous_adherent`
  MODIFY `id_sous_adherent` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=189;

--
--
-- AUTO_INCREMENT pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bordereau`
--
ALTER TABLE `bordereau`
  ADD CONSTRAINT `bordereau_ibfk_1` FOREIGN KEY (`id_bulletin`) REFERENCES `bulletin_soin` (`id_bulletin`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `bulletin_soin`
--
ALTER TABLE `bulletin_soin`
  ADD CONSTRAINT `bulletin_soin_ibfk_1` FOREIGN KEY (`id_adherent`) REFERENCES `adherent` (`id_adherent`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `bulletin_soin_ibfk_2` FOREIGN KEY (`id_sous_adherent`) REFERENCES `sous_adherent` (`id_sous_adherent`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `bulletin_soin_detail`
--
ALTER TABLE `bulletin_soin_detail`
  ADD CONSTRAINT `bulletin_soin_detail_ibfk_1` FOREIGN KEY (`id_bulletin`) REFERENCES `bulletin_soin` (`id_bulletin`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `sous_adherent`
--
ALTER TABLE `sous_adherent`
  ADD CONSTRAINT `sous_adherent_ibfk_1` FOREIGN KEY (`id_adherent`) REFERENCES `adherent` (`id_adherent`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
