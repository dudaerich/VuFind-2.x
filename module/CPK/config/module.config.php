<?php
namespace CPK\Module\Configuration;

$config = array(
    'vufind' => array(
        'plugin_managers' => array(
            'ils_driver' => array(
                'invokables' => array(
                    'dummy' => 'CPK\ILS\Driver\Dummy',
                ), /* invokables */
            ), /* ils_drivers */
            'recorddriver' => array (
                'factories' => array(
                    'solrmarc'     => 'CPK\RecordDriver\Factory::getSolrMarc',
                    'solrcpk_mzk'  => 'CPK\RecordDriver\Factory::getSolrMarcMZK',
                    'solrcpk_vkol' => 'CPK\RecordDriver\Factory::getSolrMarcVKOL',
                    'solrcpk_nlk'  => 'CPK\RecordDriver\Factory::getSolrMarcNLK',
                ) /* factories */
            ), /* recorddriver */
            'auth' => array(
                'factories' => array(
                    'perunShibboleth' => 'CPK\Auth\Factory::getPerunShibboleth',
                ), /* factories */
            ), /* auth */
        ), /* plugin_managers */
    ), /* vufind */
    'controllers' => array(
        'invokables' => array(
            'my-research' => 'CPK\Controller\MyResearchController',
            'librarycards' => 'CPK\Controller\LibraryCardsController',
            'search' => 'CPK\Controller\SearchController',
        ), /* invokables */
    ), /* controllers */
    'service_manager' => array(
        'factories' => array(
            'VuFind\AuthManager' => 'CPK\Auth\Factory::getAuthManager',
            'Perun\IdentityResolver' => 'CPK\Perun\Factory::getIdentityResolver',
        ),
    ),
);

$staticRoutes = array(
	'Statistics/Dashboard', 'Statistics/Visits', 'Statistics/Circulations',
	'Statistics/Payments', 'Statistics/Searches', 'Statistics', 'Statistics/'
);

foreach ($staticRoutes as $route) {
	list($controller, $action) = explode('/', $route);
	$routeName = str_replace('/', '-', strtolower($route));
	$config['router']['routes'][$routeName] = array(
		'type' => 'Zend\Mvc\Router\Http\Literal',
		'options' => array(
			'route' => '/' . $route,
			'defaults' => array(
				'controller' => $controller,
				'action' => (! empty($action)) ? $action : 'default',
				)
			)
	);
}

return $config;
