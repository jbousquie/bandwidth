# Bandwith3D

Un outil visuel 3D Web léger de monitoring de la bande passante des équipements du réseau pour Linux.

Dépendances : bash, snmp, jq + un serveur Web

### Installation de snmp
Exemple sur Debian/Ubuntu
```bash
sudo apt install snmp
```

### Installation de jq
Exemple sur Debian/Ubuntu
```bash
sudo apt install jq
```

### Installation d'un serveur Web
Exemple : Apache sur Debian/Ubuntu
```bash
sudo apt install apache2
```

### Test : Est-ce que ma machine peut accéder aux équipements en SNMP ?
```bash
# Exemple snmpwalk -v versionSNMP -c communautéSNMP -Onq adresseIPEquipement 1.3.6.1.2.1.31.1.1.1.1
$ snmpwalk -v 2c -c public -Onq 192.168.0.10 1.3.6.1.2.1.31.1.1.1.1
```