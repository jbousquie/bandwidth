#!/bin/bash
# Récupération des volumes de données passées par les interfaces
# dépendances : bash4+, snmp, jq

# Note : les noms des équipements et des interfaces ne doivent pas contenir d'espace, ni le caractère "@".

# Tableau associatif principal pour stocker uniquement les interfaces à monitorer de l'équipement :
# interfaces[nom] = index incrémental applicatif
# ex : interfaces["rtr_central@Gi1/0/1"] = 0
# Cet index sert à identifier l'interface choisie dans les tableaux suivants.
# Il s'agît du tableau des équipements/interfaces demandés du fichier json. Ils ou elles peuvent ne pas être trouvé(e)s dans la réalité.
#
# Un tableau indexé classique par attribut monitoré est ensuite créé :
# Id dans les OID de l'interface : ifIds[index] = ifId  
# nom de l'interface réellement monitorée ifMonitor[index] = nom (tableau inverse de interfaces, contenant seulement les monitorées) 
# description de l'interface : ifDescriptions[index] = ifDescr
# vitesse de l'interface  : ifSpeeds[index] = ifSpeed
# compteur d'octets in : ifBytesIN[index] = ifBytesIN
# compteur d'octets out : ifBytesOUT[index] = ifBytesOUT

# debugger
# set -vx

# faire un update de PATH ici sur /usr/bin ...


# fichier de log du script
ficLog=bw3d.log
# fichier des resultats des mesures, à placer dans le répertoire publié sur le web
ficMes=bw3d.data.json

# délai d'attente avant la prochaine mesure en secondes
delay=1
# nombre de mesures à conserver
nbMesures=1

# Séparateur
sep="@"


# OID de base des noms d'interface
oidIfnames=1.3.6.1.2.1.31.1.1.1.1
# OID de base des descriptions d'interface
oidIfDescriptions=1.3.6.1.2.1.2.2.1.2
# OID de base des vitesses d'interface
oidIfSpeeds=1.3.6.1.2.1.2.2.1.5
# OID de base des compteurs octets IN
oidIfBytesIN=1.3.6.1.2.1.2.2.1.10
# OID de base des compteurs octets OUT
oidIfBytesOUT=1.3.6.1.2.1.2.2.1.16


# Test arguments entrés
if [[ $# -eq 0 ]]; then
    echo 'Erreur de paramètre : le fichier de configuration de bandwith doit être passé'
    echo 'Usage : bandwith.sh fichier_bandwith.conf'
    exit 1
fi;
# Source de la configuration et tests fichiers
if [ ! -e $1 ]; then
    echo 'Erreur : fichier '$1' non trouvé.'
    exit 1
fi;

# Purge du fichier de log
>$ficLog

# Recupération des objets du fichier devices.json pour SNMP
# jq -r pour supprimer les double quotes autour des strings renvoyées

# Équipements
listeNomsDevices=$(jq -r '.name + "'$sep'" + .ip + "'$sep'" + .community + "'$sep'" + .version' "$1")
pattern=$sep"*"
# un tableau associatif indexé par le nom d'équipement pour chaque propriété : ip, community, version snmp
declare -A deviceIP
declare -A deviceCommunity
declare -A deviceVersion
for n in $listeNomsDevices; do
    name=${n%%$pattern}
    tmp=${n#$name@}
    ip=${tmp%%$pattern}
    tmp=${n#$name@$ip@}
    com=${tmp%%$pattern}
    version=${n#$name@$ip@$com@}
    deviceIP[$name]="$ip"
    deviceCommunity[$name]="$com"
    deviceVersion[$name]="$version"
done


# Noms des interfaces : on concatène nomDevice + "@" + nomInterface
listeNomsInterfaces=$(jq -r '.name + "@" + (.interfaces | keys[])' "$1")
ifnames=()
for n in $listeNomsInterfaces; do
    ifnames+=($n)
done


# Index des interfaces des équipements : tableau associatif, exemple : interfaces["rtr-central@Gi1/0/6"] = 3
# C'est le tableau principal de référence pour les index de tous les autres tableaux
declare -A interfaces
for i in ${!ifnames[@]}; do
    interfaces[${ifnames[$i]}]="$i"
done


# Déclaration des tableaux de résultats
ifMonitor=()
ifIds=()
ifDescriptions=()
ifSpeeds=()
ifBytesIN=()
ifBytesOUT=()


# Boucle sur les équipements réels pour récupérer les interfaces existantes et leurs ID
for devName in ${!deviceIP[@]}; do
    ip=${deviceIP[$devName]}
    community=${deviceCommunity[$devName]}
    version=${deviceVersion[$devName]}

    # Recherche des noms des interfaces réelles de l'équipement.
    # Paramètres de snmpwalk
    walkParams=' -v '$version' -c '$community' -Onq '$ip' '
    # Récupération des interfaces de l'équipement avec leur nom
    walkIfname=$(snmpwalk $walkParams $oidIfnames)

    # Recherche dans tous les noms d'interfaces trouvés sur un équipement, ceux demandés par le monitoring.
    # Quand un nom est trouvé, on stocke son Id  dans le tableau ifIds
    # https://www.tldp.org/LDP/abs/html/string-manipulation.html
    n=1                     # compteur
    currentId=              # valeur courante Id d'interface
    substringToRemove=.$oidIfnames.  # chaîne à retirer du résultat '.'+oidDeBase+'.'
    for w in $walkIfname; do
        # $walkInfame contient une suite de paires OID, nom. On ne retiendra donc que l'OID correspondant au nom, soit l'élément précédent
        # on ne traite donc qu'un élément sur deux en calculant le modulo 2 du compteur incrémental.  
        modulo=$(($n%2))
        if (( $modulo == 0 ))
        then
            # le résultat courant du walk fait-il partie des clés du tableau des interfaces à monitorer ?
            # si oui, on le stocke son Id dans le tableau idIds
            for i in ${!interfaces[@]}; do
                # rappel : les clés de interfaces sont de la forme "deviceName@ifaceName"
                nomIface=\"${i#$devName$sep}\"

                if [[ $nomIface == $w ]]; then
                    # récupération de l'index applicatif dans le tableau global des interfaces monitorées
                    index=${interfaces[$i]}
                
                    # pour comprendre la valeur renvoyée ici par le walk : echo $currentId
                    # retrait de la chaine OID de base entourée de '.' pour ne conserver que l'Id final de l'interface
                    ifId=${currentId#$substringToRemove}   

                    # stockage de l'Id de l'interface à l'index $index du tableau des Id
                    ifIds[$index]=$ifId

                    # stockage du nom de l'interface monitorée
                    ifMonitor[$index]="$i" 

                    # log de l'entrée monitorée
                    echo "$i" monitorée : $(date '+%Y-%m-%d %H:%M:%S') | tee -a "$ficLog"
            
                    # plus besoin de continuer la boucle si on a trouvé l'interface
                    break
                fi
            done
        else
            currentId=$w
        fi

        n=$((n+1))
    done
done


#######################################
#                                     #
# Boucle de monitoring                #
#                                     #
#######################################

# nombre de lignes à conserver dans le fichier de mesure = nb interfaces * nbMesures
nbLignes=$((${#ifMonitor[@]} * $nbMesures))



while :
do
    # boucle sur les interfaces réellement monitorées
    for index in ${!ifMonitor[@]}; do

        # récupération du nom deviceName@iface@Name
        nom=${ifMonitor[$index]}

        #nom du device portant l'interface
        devName=${nom%%$pattern}

        # récupération des valeurs de paramètres snmp
        ip=${deviceIP[$devName]}
        version=${deviceVersion[$devName]}
        community=${deviceCommunity[$devName]}

        # Paramètres de snmpget
        getParams=' -v '$version' -c '$community' -Ovq '$ip' '

        # récupération de l'Id de l'interface
        ifId=${ifIds[$index]}

        # collecte de la description et suppression des doubles quotes éventuelles
        temp=$(snmpget $getParams $oidIfDescriptions.$ifId)
        temp="${temp%\"}"
        resDescription="${temp#\"}"
        # collecte de la vitesse
        resSpeed=$(snmpget $getParams $oidIfSpeeds.$ifId)
        # collecte des octets IN
        resIN=$(snmpget $getParams $oidIfBytesIN.$ifId)
        # collecte des octets OUT
        resOUT=$(snmpget $getParams $oidIfBytesOUT.$ifId)

        # écriture du résultat brut dans un fichier
        echo $nom $resDescription $resSpeed $resIN $resOUT $(date +%s)>> res.raw 

    done
    
    # taille du fichier résultats à $nbLignes
    tail -n $nbLignes res.raw | tee res.raw > /dev/null

    # formatage du résultat JSON
    # http://support.gnip.com/articles/data-and-rule-management-with-jq.html
    # on passe par un fichier temporaire pour limiter le temps d'indisponibilité au web de $ficMes
    jq '. | split("\n") | map( split(" ") | select(.[0] != null) | {ifname: .[0], description: .[1], speed: .[2], in: .[3], out: .[4], ts: .[5]} ) ' -R -s res.raw > tmp 
    cat tmp > $ficMes
    
    # attente avant prochaine mesure
    sleep $delay
done


