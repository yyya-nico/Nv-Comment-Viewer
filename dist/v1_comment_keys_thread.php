<?php
if(isset($_GET['videoId'])) {
    $video_id = $_GET['videoId'];
    
    $CURLERR = NULL;

    $url = 'https://nvapi.nicovideo.jp/v1/comment/keys/thread?videoId='.$video_id;

    $header = array(        
        'X-Frontend-Id: 6',
        'X-Frontend-Version: 0',
        'Content-Type: application/json'
    );

    $ch = curl_init($url);

    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

    if(curl_errno($ch)){
        $CURLERR .= 'curl_errno：' . curl_errno($ch) . '\n';
        $CURLERR .= 'curl_error：' . curl_error($ch) . '\n';
        $CURLERR .= '▼curl_getinfo' . '\n';
        foreach(curl_getinfo($ch) as $key => $val){
            $CURLERR .= '■' . $key . '：' . $val . '\n';
        }
        echo nl2br($CURLERR);
    } else {
        header('Content-Type: application/json');
        header('HTTP/2 '.$http_code);
    }
    curl_close($ch);
    echo $html;

} else {
    header('HTTP/2 400 Bad Request');
    echo 'Not set a params';
}