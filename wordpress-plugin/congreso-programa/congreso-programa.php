<?php
/**
 * Plugin Name: Congreso Programa
 * Plugin URI: https://grupoelis.com
 * Description: Muestra el programa de congresos usando la API de ShockLogic mediante shortcode.
 * Version: 1.0.0
 * Author: Grupo ELIS
 * Author URI: https://grupoelis.com
 * Text Domain: congreso-programa
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CONGRESO_PROGRAMA_VERSION', '1.0.0');
define('CONGRESO_PROGRAMA_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONGRESO_PROGRAMA_PLUGIN_URL', plugin_dir_url(__FILE__));

class Congreso_Programa {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', array($this, 'register_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'register_assets'));
    }

    public function register_assets() {
        wp_register_style(
            'congreso-programa-css',
            CONGRESO_PROGRAMA_PLUGIN_URL . 'assets/css/congreso-programa.css',
            array(),
            CONGRESO_PROGRAMA_VERSION
        );

        wp_register_script(
            'congreso-programa-js',
            CONGRESO_PROGRAMA_PLUGIN_URL . 'assets/js/congreso-programa.js',
            array(),
            CONGRESO_PROGRAMA_VERSION,
            true
        );
    }

    public function register_shortcode() {
        add_shortcode('congreso_programa', array($this, 'render_shortcode'));
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'id'   => '',
            'lang' => 'ESP'
        ), $atts, 'congreso_programa');

        if (empty($atts['id'])) {
            return '<p style="color: red;">Error: Se requiere el atributo "id" del congreso.</p>';
        }

        $congress_id = sanitize_text_field($atts['id']);
        $lang = strtoupper(sanitize_text_field($atts['lang']));

        if (!in_array($lang, array('ESP', 'ENG'))) {
            $lang = 'ESP';
        }

        wp_enqueue_style('congreso-programa-css');
        wp_enqueue_script('congreso-programa-js');

        $countries_json_url = CONGRESO_PROGRAMA_PLUGIN_URL . 'assets/data/countries_with_flags.json';

        wp_localize_script('congreso-programa-js', 'congressProgramaConfig', array(
            'congressId'   => $congress_id,
            'lang'         => $lang,
            'apiBase'      => 'https://api.shocklogic.com/v1.0',
            'countriesUrl' => $countries_json_url,
            'translations' => $this->get_translations($lang)
        ));

        $unique_id = 'congreso-programa-' . uniqid();

        ob_start();
        ?>
        <div id="<?php echo esc_attr($unique_id); ?>" class="congreso-programa-container" data-congress-id="<?php echo esc_attr($congress_id); ?>" data-lang="<?php echo esc_attr($lang); ?>">
            <div class="cp-loader">
                <div class="cp-loader-spinner"></div>
                <p><?php echo $lang === 'ESP' ? 'Cargando programa...' : 'Loading programme...'; ?></p>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function get_translations($lang) {
        $translations = array(
            'ESP' => array(
                'loading'           => 'Cargando programa...',
                'loadingData'       => 'Cargando datos...',
                'allRooms'          => 'Todas las salas',
                'hour'              => 'Hora',
                'session'           => 'Sesión',
                'location'          => 'Ubicación',
                'coordinates'       => 'Coordina y modera',
                'presentations'     => 'Presentaciones',
                'notAvailable'      => 'Información no disponible',
                'room'              => 'Sala',
                'errorLoading'      => 'Error al cargar el programa',
                'noSessions'        => 'No hay sesiones para este día',
            ),
            'ENG' => array(
                'loading'           => 'Loading programme...',
                'loadingData'       => 'Loading data...',
                'allRooms'          => 'All rooms',
                'hour'              => 'Time',
                'session'           => 'Session',
                'location'          => 'Location',
                'coordinates'       => 'Chair',
                'presentations'     => 'Presentations',
                'notAvailable'      => 'Information not available',
                'room'              => 'Room',
                'errorLoading'      => 'Error loading programme',
                'noSessions'        => 'No sessions for this day',
            )
        );

        return $translations[$lang];
    }
}

Congreso_Programa::get_instance();
