<?php
/**
 * Ajax Controller Module
 *
 * PHP version 5
 *
 * Copyright (C) Villanova University 2010.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @category VuFind2
 * @package  Controller
 * @author   Chris Hallberg <challber@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:building_a_controller Wiki
 */
namespace CPK\Controller;

use MZKCommon\Controller\AjaxController as AjaxControllerBase;

/**
 * This controller handles global AJAX functionality
 *
 * @category VuFind2
 * @package Controller
 * @author Martin Kravec <Martin.Kravec@mzk.cz>
 * @license http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link http://vufind.org/wiki/vufind2:building_a_controller Wiki
 */
class AjaxController extends AjaxControllerBase
{

    /**
     * Get Buy Links
     *
     * @author Martin Kravec <Martin.Kravec@mzk.cz>
     *
     * @return \Zend\Http\Response
     */
    protected function getBuyLinksAjax()
    {
        // Antikvariaty
        $parentRecordID = $this->params()->fromQuery('parentRecordID');
        $recordID = $this->params()->fromQuery('recordID');

        $recordLoader = $this->getServiceLocator()->get('VuFind\RecordLoader');

        $parentRecordDriver = $recordLoader->load($parentRecordID);
        $recordDriver = $recordLoader->load($recordID);

        $antikvariatyLink = $parentRecordDriver->getAntikvariatyLink();

        // GoogleBooks & Zbozi.cz
        $wantItFactory = $this->getServiceLocator()->get('WantIt\Factory');
        $buyChoiceHandler = $wantItFactory->createBuyChoiceHandlerObject($recordDriver);

        $gBooksLink = $buyChoiceHandler->getGoogleBooksVolumeLink();
        $zboziLink = $buyChoiceHandler->getZboziLink();

        $buyChoiceLinksCount = 0;

        if ($gBooksLink) {
            ++ $buyChoiceLinksCount;
        }

        if ($zboziLink) {
            ++ $buyChoiceLinksCount;
        }

        if ($antikvariatyLink) {
            ++ $buyChoiceLinksCount;
        }

        $vars[] = array(
            'gBooksLink' => $gBooksLink ?  : '',
            'zboziLink' => $zboziLink ?  : '',
            'antikvariatyLink' => $antikvariatyLink ?  : '',
            'buyLinksCount' => $buyChoiceLinksCount
        );

        // Done
        return $this->output($vars, self::STATUS_OK);
    }

    /**
     * Returns subfileds of MARC 996 field for specific recordID
     *
     * @param string $_POST['record']
     * @param string $_POST['field']
     * @param string $_POST['subfields']
     *            subfileds
     *
     * @return array subfields values
     */
    public function getMarc996ArrayAjax()
    {
        $recordID = $this->params()->fromQuery('recordID');
        $field = $this->params()->fromQuery('field');
        $subfieldsArray = explode(",", $this->params()->fromQuery('subfields'));

        $recordLoader = $this->getServiceLocator()->get('VuFind\RecordLoader');

        $recordDriver = $recordLoader->load($recordID);
        $arr = $recordDriver->get996($subfieldsArray);

        $vars[] = array(
            'arr' => $arr
        );

        // Done
        return $this->output($vars, self::STATUS_OK);
    }

    /**
     * Downloads SFX JIB content for current record.
     *
     * @param string $institute
     *
     * @return array
     */
    public function callSfxAjax()
    {
        $institute = $this->params()->fromQuery('institute');
        if (! $institute)
            $institute = 'ANY';

        $recordID = $this->params()->fromQuery('recordID');
        $recordLoader = $this->getServiceLocator()->get('VuFind\RecordLoader');
        $recordDriver = $recordLoader->load($recordID);

        $url = $this->params()->fromQuery('sfxUrl');

        $additionalParams = array();
        parse_str($recordDriver->getOpenURL(), $additionalParams);

        $params = array(
            'sfx.institute' => $institute,
            'ctx_ver' => 'Z39.88-2004',
            'ctx_enc' => 'info:ofi/enc:UTF-8',
            'sfx.response_type' => 'simplexml'
        );

        $allParams = array_merge($params, $additionalParams);

        $wantItFactory = $this->getServiceLocator()->get('WantIt\Factory');
        $electronicChoiceHandler = $wantItFactory->createElectronicChoiceHandlerObject($recordDriver);

        $sfxResult = $electronicChoiceHandler->getRequestDataResponseAsArray($url, $allParams);

        $vars[] = array(
            'sfxResult' => $sfxResult
        );

        // Done
        return $this->output($vars, self::STATUS_OK);
    }

    /**
     * Downloads SerialSoulution360link content for current record.
     *
     * @param string $institute
     *
     * @return array
     */
    public function callSerialSoulution360link()
    {
        $institute = $this->params()->fromQuery('institute');
        if (! $institute)
            $institute = 'ANY';

        $recordID = $this->params()->fromQuery('recordID');
        $recordLoader = $this->getServiceLocator()->get('VuFind\RecordLoader');
        $recordDriver = $recordLoader->load($recordID);

        $url = $this->params()->fromQuery('sfxUrl');

        $additionalParams = array();
        parse_str($recordDriver->getOpenURL(), $additionalParams);

        $params = array();

        $allParams = array_merge($params, $additionalParams);

        $wantItFactory = $this->getServiceLocator()->get('WantIt\Factory');
        $electronicChoiceHandler = $wantItFactory->createElectronicChoiceHandlerObject($recordDriver);

        $ss360linkResult = $electronicChoiceHandler->getRequestDataResponseAsArray($url, $allParams);

        $vars[] = array(
            'ss360link' => $ss360linkResult
        );

        // Done
        return $this->output($vars, self::STATUS_OK);
    }

    /**
     * Downloads EbscoLinksource content for current record.
     *
     * @param string $institute
     *
     * @return array
     */
    public function callEbscoLinksource()
    {
        $institute = $this->params()->fromQuery('institute');
        if (! $institute)
            $institute = 'ANY';

        $recordID = $this->params()->fromQuery('recordID');
        $recordLoader = $this->getServiceLocator()->get('VuFind\RecordLoader');
        $recordDriver = $recordLoader->load($recordID);

        $url = $this->params()->fromQuery('sfxUrl');

        $additionalParams = array();
        parse_str($recordDriver->getOpenURL(), $additionalParams);

        $params = array();

        $allParams = array_merge($params, $additionalParams);

        $wantItFactory = $this->getServiceLocator()->get('WantIt\Factory');
        $electronicChoiceHandler = $wantItFactory->createElectronicChoiceHandlerObject($recordDriver);

        $ebscoLinksourceResult = $electronicChoiceHandler->getRequestDataResponseAsArray($url, $allParams);

        $vars[] = array(
            'ebscoLinksource' => $ebscoLinksourceResult
        );

        // Done
        return $this->output($vars, self::STATUS_OK);
    }

    public function getHoldingsStatusesAjax()
    {
        $ids = $this->params()->fromQuery('ids');

        $nextItemToken = $this->params()->fromQuery('nextItemToken');

        $ilsDriver = $this->getILS()->getDriver();

        if ($ilsDriver instanceof \CPK\ILS\Driver\MultiBackend) {

            //die();
            $statuses = $ilsDriver->getStatuses($ids, $nextItemToken);

            if (null === $statuses)
                return $this->output('$ilsDriver->getStatuses returned null', self::STATUS_ERROR);

            $itemsStatuses = [];

            foreach ($statuses as $status) {
                $id = $status['id'];

                // FIXME: Translate the status ...
                $itemsStatuses[$id] = $status['status'];

                // TODO: Compare $statuses to $ids & include to response which ids has to be parsed next
                // TODO: Include NextItemToken if any ..

                $key = array_search($id, $ids);
                unset($ids[$key]);
            }

            if (isset($ids) && count($ids) > 0)
                $retVal['remaining'] = $ids;

            $retVal['statuses'] = $itemsStatuses;
            return $this->output($retVal, self::STATUS_OK);
        } else
            return $this->output("ILS Driver isn't instanceof MultiBackend - ending job now.", self::STATUS_ERROR);
    }
}