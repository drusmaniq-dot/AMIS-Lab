function varargout = PlantSensitivityResponse3(varargin)
% PLANTSENSITIVITYRESPONSE3 MATLAB code for PlantSensitivityResponse3.fig
%      PLANTSENSITIVITYRESPONSE3, by itself, creates a new PLANTSENSITIVITYRESPONSE3 or raises the existing
%      singleton*.
%
%      H = PLANTSENSITIVITYRESPONSE3 returns the handle to a new PLANTSENSITIVITYRESPONSE3 or the handle to
%      the existing singleton*.
%
%      PLANTSENSITIVITYRESPONSE3('CALLBACK',hObject,eventData,handles,...) calls the local
%      function named CALLBACK in PLANTSENSITIVITYRESPONSE3.M with the given input arguments.
%
%      PLANTSENSITIVITYRESPONSE3('Property','Value',...) creates a new PLANTSENSITIVITYRESPONSE3 or raises the
%      existing singleton*.  Starting from the left, property value pairs are
%      applied to the GUI before PlantSensitivityResponse3_OpeningFcn gets called.  An
%      unrecognized property name or invalid value makes property application
%      stop.  All inputs are passed to PlantSensitivityResponse3_OpeningFcn via varargin.
%
%      *See GUI Options on GUIDE's Tools menu.  Choose "GUI allows only one
%      instance to run (singleton)".
%
% See also: GUIDE, GUIDATA, GUIHANDLES

% Edit the above text to modify the response to help PlantSensitivityResponse3

% Last Modified by GUIDE v2.5 02-May-2026 14:55:13

% Begin initialization code - DO NOT EDIT
gui_Singleton = 1;
gui_State = struct('gui_Name',       mfilename, ...
                   'gui_Singleton',  gui_Singleton, ...
                   'gui_OpeningFcn', @PlantSensitivityResponse3_OpeningFcn, ...
                   'gui_OutputFcn',  @PlantSensitivityResponse3_OutputFcn, ...
                   'gui_LayoutFcn',  [] , ...
                   'gui_Callback',   []);
if nargin && ischar(varargin{1})
    gui_State.gui_Callback = str2func(varargin{1});
end

if nargout
    [varargout{1:nargout}] = gui_mainfcn(gui_State, varargin{:});
else
    gui_mainfcn(gui_State, varargin{:});
end
% End initialization code - DO NOT EDIT


% --- Executes just before PlantSensitivityResponse3 is made visible.
function PlantSensitivityResponse3_OpeningFcn(hObject, eventdata, handles, varargin)
% This function has no output args, see OutputFcn.
% hObject    handle to figure
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% varargin   command line arguments to PlantSensitivityResponse3 (see VARARGIN)

% Choose default command line output for PlantSensitivityResponse3
handles.output = hObject;

% Update handles structure
guidata(hObject, handles);

% UIWAIT makes PlantSensitivityResponse3 wait for user response (see UIRESUME)
% uiwait(handles.figure1);


% --- Outputs from this function are returned to the command line.
function varargout = PlantSensitivityResponse3_OutputFcn(~, eventdata, handles) 
% varargout  cell array for returning output args (see VARARGOUT);
% hObject    handle to figure
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Get default command line output from handles structure
varargout{1} = handles.output;


% --- Executes on selection change in popupmenu1.
function popupmenu1_Callback(hObject, eventdata, handles)
% hObject    handle to popupmenu1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Hints: contents = cellstr(get(hObject,'String')) returns popupmenu1 contents as cell array
%        contents{get(hObject,'Value')} returns selected item from popupmenu1


% --- Executes during object creation, after setting all properties.
function popupmenu1_CreateFcn(hObject, eventdata, handles)
% hObject    handle to popupmenu1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    empty - handles not created until after all CreateFcns called

% Hint: popupmenu controls usually have a white background on Windows.
%       See ISPC and COMPUTER.
if ispc && isequal(get(hObject,'BackgroundColor'), get(0,'defaultUicontrolBackgroundColor'))
    set(hObject,'BackgroundColor','white');
end


% --- Executes on button press in pushbutton1.
function pushbutton1_Callback(hObject, eventdata, handles)
% hObject    handle to pushbutton1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
% readint the PL data 
% 1. Open a file selection dialog filtered for .txt files
%[file, path] = uigetfile('*.txt', 'Select a text file to read');

%% Dynamic File Loading System using a Loop
%% Set this to1, 2,3, 4, etc., if you want to load more files.
num_files = str2double(get(handles.edit6, 'String'));

%% Universal Standardization Grid Setup
% This establishes a clean, continuous wavelength track (Column vector)
wavelength_grid = (350:1:800)'; 

% Initialize a cumulative vector to add all the intensities together
PL_Total = zeros(length(wavelength_grid), 1);

if num_files == 1
    [file, path] = uigetfile('D:\MIKEV2\Emission\*.txt', 'Select a text file to read');
    
    if isequal(file, 0)
        disp('User clicked Cancel');
        return; % Exit safely if canceled
    else
        fullPath = fullfile(path, file);
        T = readtable(fullPath);
        M_raw = table2array(T);
        
        % Interpolate onto the standard wavelength grid
        M_interp = interp1(M_raw(:,1), M_raw(:,2), wavelength_grid, 'linear', 0);
        
        % For 1 file, the total is just this single interpolated curve
        PL_Total = M_interp;
    end 

elseif num_files >= 2 && num_files <= 4
    % This unified block dynamically handles 2, 3, or 4 files using a loop
    lambda_cells = cell(1, num_files);
    M_cells      = cell(1, num_files);
    file_names   = cell(1, num_files);
    
    % 1. Loop file prompt to fetch all selected files dynamically
    for i = 1:num_files
        dialog_title = sprintf('Select PL Emission Curve %d', i);
        [file, path] = uigetfile('D:\MIKEV2\Emission\*.txt', dialog_title);
        
        if isequal(file, 0)
            error('Execution stopped: User canceled selection for File %d.', i);
        else
            file_names{i} = file;
            fullPath = fullfile(path, file);
            T = readtable(fullPath);
            M_temp = table2array(T);
            
            lambda_cells{i} = M_temp(:, 1); 
            M_cells{i}      = M_temp(:, 2); 
        end
    end
    
    % 2. Process, interpolate, and ADD all peaks together into one vector
    for i = 1:num_files
        temp_interp = interp1(lambda_cells{i}, M_cells{i}, wavelength_grid, 'linear', 0);
        
        % Optional: Normalize individual file peak to 1.0 before addition 
        % so they contribute equally regardless of spectrometer scaling
        if max(temp_interp) > 0
            temp_interp = temp_interp / max(temp_interp); 
        end
        
        % Add this file's peak directly into the cumulative total vector
        PL_Total = PL_Total + temp_interp;
    end
end

%% 3. Normalize and Save the Combined Peak Vector
% Normalize the final added spectrum to a peak maximum of 1.0
if max(PL_Total) > 0
    PL_Total = PL_Total / max(PL_Total); 
end

% Create the final 2-column matrix: Column 1 = Wavelength, Column 2 = Added Intensities
M = [wavelength_grid, PL_Total];

% Save directly into your target MAT file
save('PLdata.mat', 'M');

% Optional verification plot to make sure the added curves look perfect
% plot(M(:,1), M(:,2), 'LineWidth', 2); title('Added Cumulative Spectrum');
function edit1_CreateFcn(hObject, eventdata, handles)
% hObject    handle to edit7 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    empty - handles not created until after all CreateFcns called

% Hint: edit controls usually have a white background on Windows.
%       See ISPC and COMPUTER.
if ispc && isequal(get(hObject,'BackgroundColor'), get(0,'defaultUicontrolBackgroundColor'))
    set(hObject,'BackgroundColor','white');
end

function edit1_Callback(hObject, eventdata, handles)
% hObject    handle to edit8 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Hints: get(hObject,'String') returns contents of edit8 as text
%        str2double(get(hObject,'String')) returns contents of edit8 as a double

% --- Executes on button press in pushbutton2.
function pushbutton2_Callback(hObject, eventdata, handles)
% hObject    handle to pushbutton2 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)
%clear; 
clc;hold off
h2 = findobj('Tag','popupmenu2');
va22 = get(h2,'Value');
string_list = get(h2,'String')
RareEarthMateria2 = (string_list{va22})
if strcmp(RareEarthMateria2,'Er')==1;
    GEmission = 'Emission of Glass doped with Erbium'
end  
if strcmp(RareEarthMateria2,'Tm')==1;
    GEmission = 'Emission of Glass doped with Thulium'
end  
if strcmp(RareEarthMateria2,'Pr')==1;
    GEmission = 'Emission of Glass doped with Praseodymium'
end
if strcmp(RareEarthMateria2,'Sm')==1;
    GEmission = 'Emission of Glass doped with Samarium'
end  
if strcmp(RareEarthMateria2,'Eu')==1;
    GEmission = 'Emission of Glass doped with Europium'
end  
if strcmp(RareEarthMateria2,'Tb')==1;
    GEmission = 'Emission of Glass doped with Terbium'
end  
if strcmp(RareEarthMateria2,'SmTm')==1;
    GEmission = 'Emission of Glass Codoped with Samarium-Europium'
end  
if strcmp(RareEarthMateria2,'SmEu')==1;
    GEmission = 'Emission of Glass Codoped with Samarium-Thulium'
end 
if strcmp(RareEarthMateria2,'SmTmNd')==1;
    GEmission = 'Emission of Glass Co-doped with Samarium/Thulium/Neodymium'
end
if strcmp(RareEarthMateria2,'SmTmTb')==1;
    GEmission = 'Emission of Glass Co-doped with Samarium/Thulium/Neodymium'
end
if strcmp(RareEarthMateria2,'Co')==1;
    GEmission = 'Emission due to Cobalt element'
end
if strcmp(RareEarthMateria2,'Cr')==1;
    GEmission = 'Emission due to Chromium element'
end
if strcmp(RareEarthMateria2,'Ni')==1;
    GEmission = 'Emission due to Nickel element'
end
if strcmp(RareEarthMateria2,'Fe')==1;
    GEmission = 'Emission due to Iron element'
end
if strcmp(RareEarthMateria2,'Ag')==1;
    GEmission = 'Emission due to Silver element'
end
h1 = findobj('Tag','popupmenu1');
val1 = get(h1,'Value');
string_list = get(h1,'String')
RareEarthMaterial = (string_list{val1})

if strcmp(RareEarthMaterial,'Select.File')==1;
wavelength_grid = (350:1:800)'; 

PL_Total = zeros(length(wavelength_grid), 1);
% --- 4. Plotting ---
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
% import the Plant sensitivity Curve.
[file, path] = uigetfile('D:\MIKEV2\Emission\*.txt', 'Select a text file to read');  
    if isequal(file, 0)
        disp('User clicked Cancel');
        return; % Exit safely if canceled
    else
        fullPath = fullfile(path, file);
        T = readtable(fullPath);
        M_raw = table2array(T);
        
        % Interpolate onto the standard wavelength grid
        M_interp = interp1(M_raw(:,1), M_raw(:,2), wavelength_grid, 'linear', 0);
        
        % For 1 file, the total is just this single interpolated curve
        PlantSC_Total = [wavelength_grid M_interp]
    end
   M_interp  = M_interp / max(M_interp); % Normalize
X= M_interp;
%X2= McCree2;
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
%% Plot the output
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength, X, 'b--', 'DisplayName', 'Selected Plant S');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Standard Plant Sensitivity Curve','Blue region', 'Green region', 'Red region'});
 
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 4. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 5. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Vinca_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Vinca_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength_grid, X, 'b--', 'LineWidth', 1.5, 'DisplayName', 'PlantSCurve');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end

if strcmp(RareEarthMaterial,'Chorophylla')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');

% Absorption spectra of plant pigments, including: chlorophyll a, 
% chlorophyll b, photosensitive pigment PR, and photosensitive pigment PFR.
% Data taken from : Yang C, Liu W, You Q, Zhao X, Liu S, Xue L, Sun J, Jiang X. 
% Recent Advances in Light-Conversion Phosphors for Plant Growth and Strategies 
% for the Modulation of Photoluminescence Properties. Nanomaterials (Basel). 
% 2023 May 23;13(11):1715. doi: 10.3390/nano13111715. PMID: 37299618; PMCID: PMC10254275.
chla = [390,0.08; 410,0.22; 430,0.54; 445,0.47; 460,0.98; 470,0.40; 480,0.12; 500,0.05; 520,0.08; 540,0.07; 570,0.09; 600,0.06; 620,0.15; 645,0.10; 665,0.73; 680,0.25; 700,0.01];
chlb = [390,0.15; 415,0.40; 435,0.51; 455,0.94; 465,0.96; 475,0.20; 490,0.03; 520,0.04; 550,0.03; 590,0.08; 615,0.60; 635,0.18; 655,0.06; 680,0.01];
pr   = [350,0.23; 375,0.31; 400,0.20; 425,0.07; 450,0.02; 500,0.01; 550,0.08; 600,0.32; 635,0.68; 666,1.00; 685,0.58; 700,0.18; 730,0.04; 760,0.02; 800,0.01];
pfr  = [350,0.09; 380,0.22; 405,0.26; 435,0.15; 470,0.04; 520,0.01; 570,0.03; 620,0.11; 660,0.31; 680,0.44; 710,0.46; 735,0.65; 760,0.35; 780,0.11; 800,0.02];
% Use Spline Interpolation for smooth, natural curve profiles
w_query = 300:0.5:800;
y_chla  = pchip(chla(:,1), chla(:,2), w_query); y_chla(w_query < 390 | w_query > 700) = 0;
y_chlb  = pchip(chlb(:,1), chlb(:,2), w_query); y_chlb(w_query < 390 | w_query > 680) = 0;
y_pr    = pchip(pr(:,1), pr(:,2), w_query);
y_pfr   = pchip(pfr(:,1), pfr(:,2), w_query);
n=size(wavelength,1)
X= y_chla(1:n);
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(w_query, y_chla, 'Color', [0.00 0.85 0.25], 'LineWidth', 2);
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Absorption spectra of chlorophyll a','Blue region', 'Green region', 'Red region'});
 
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Chorophylla', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Chorophylla', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Chorophyllb')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');

% Absorption spectra of plant pigments, including: chlorophyll a, 
%chlorophyll b, photosensitive pigment PR, and photosensitive pigment PFR.
% Data taken from : Yang C, Liu W, You Q, Zhao X, Liu S, Xue L, Sun J, Jiang X. 
% Recent Advances in Light-Conversion Phosphors for Plant Growth and Strategies 
% for the Modulation of Photoluminescence Properties. Nanomaterials (Basel). 
% 2023 May 23;13(11):1715. doi: 10.3390/nano13111715. PMID: 37299618; PMCID: PMC10254275.
chla = [390,0.08; 410,0.22; 430,0.54; 445,0.47; 460,0.98; 470,0.40; 480,0.12; 500,0.05; 520,0.08; 540,0.07; 570,0.09; 600,0.06; 620,0.15; 645,0.10; 665,0.73; 680,0.25; 700,0.01];
chlb = [390,0.15; 415,0.40; 435,0.51; 455,0.94; 465,0.96; 475,0.20; 490,0.03; 520,0.04; 550,0.03; 590,0.08; 615,0.60; 635,0.18; 655,0.06; 680,0.01];
pr   = [350,0.23; 375,0.31; 400,0.20; 425,0.07; 450,0.02; 500,0.01; 550,0.08; 600,0.32; 635,0.68; 666,1.00; 685,0.58; 700,0.18; 730,0.04; 760,0.02; 800,0.01];
pfr  = [350,0.09; 380,0.22; 405,0.26; 435,0.15; 470,0.04; 520,0.01; 570,0.03; 620,0.11; 660,0.31; 680,0.44; 710,0.46; 735,0.65; 760,0.35; 780,0.11; 800,0.02];
% Use Spline Interpolation for smooth, natural curve profiles
w_query = 300:0.5:800;
y_chla  = pchip(chla(:,1), chla(:,2), w_query); y_chla(w_query < 390 | w_query > 700) = 0;
y_chlb  = pchip(chlb(:,1), chlb(:,2), w_query); y_chlb(w_query < 390 | w_query > 680) = 0;
y_pr    = pchip(pr(:,1), pr(:,2), w_query);
y_pfr   = pchip(pfr(:,1), pfr(:,2), w_query);
n=size(wavelength,1)
X= y_chlb(1:n);
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(w_query, y_chlb, 'Color', [0.00 0.85 0.25], 'LineWidth', 2);
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Absorption spectra of chlorophyll b','Blue region', 'Green region', 'Red region'});
 
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%**********************************
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Chorophyllb', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Chorophyllb', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end;
%*****************************************************
end
if strcmp(RareEarthMaterial,'pigmentPR')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');

% Absorption spectra of plant pigments, including: chlorophyll a, 
%chlorophyll b, photosensitive pigment PR, and photosensitive pigment PFR.
% Data taken from : Yang C, Liu W, You Q, Zhao X, Liu S, Xue L, Sun J, Jiang X. 
% Recent Advances in Light-Conversion Phosphors for Plant Growth and Strategies 
% for the Modulation of Photoluminescence Properties. Nanomaterials (Basel). 
% 2023 May 23;13(11):1715. doi: 10.3390/nano13111715. PMID: 37299618; PMCID: PMC10254275.
chla = [390,0.08; 410,0.22; 430,0.54; 445,0.47; 460,0.98; 470,0.40; 480,0.12; 500,0.05; 520,0.08; 540,0.07; 570,0.09; 600,0.06; 620,0.15; 645,0.10; 665,0.73; 680,0.25; 700,0.01];
chlb = [390,0.15; 415,0.40; 435,0.51; 455,0.94; 465,0.96; 475,0.20; 490,0.03; 520,0.04; 550,0.03; 590,0.08; 615,0.60; 635,0.18; 655,0.06; 680,0.01];
pr   = [350,0.23; 375,0.31; 400,0.20; 425,0.07; 450,0.02; 500,0.01; 550,0.08; 600,0.32; 635,0.68; 666,1.00; 685,0.58; 700,0.18; 730,0.04; 760,0.02; 800,0.01];
pfr  = [350,0.09; 380,0.22; 405,0.26; 435,0.15; 470,0.04; 520,0.01; 570,0.03; 620,0.11; 660,0.31; 680,0.44; 710,0.46; 735,0.65; 760,0.35; 780,0.11; 800,0.02];
% Use Spline Interpolation for smooth, natural curve profiles
w_query = 330:0.5:800;
y_chla  = pchip(chla(:,1), chla(:,2), w_query); y_chla(w_query < 390 | w_query > 700) = 0;
y_chlb  = pchip(chlb(:,1), chlb(:,2), w_query); y_chlb(w_query < 390 | w_query > 680) = 0;
y_pr    = pchip(pr(:,1), pr(:,2), w_query);
y_pfr   = pchip(pfr(:,1), pfr(:,2), w_query);
n=size(wavelength,1);
X= y_pr(1:n);
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(w_query, y_pr, 'Color', [0.00 0.85 0.25], 'LineWidth', 2);
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Absorption spectra of photosensitive pigment PR','Blue region', 'Green region', 'Red region'});
 
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','pigmentPR', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','pigmentPR', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'pigmentPRF')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');

% Absorption spectra of plant pigments, including: chlorophyll a, 
%chlorophyll b, photosensitive pigment PR, and photosensitive pigment PFR.
% Data taken from : Yang C, Liu W, You Q, Zhao X, Liu S, Xue L, Sun J, Jiang X. 
% Recent Advances in Light-Conversion Phosphors for Plant Growth and Strategies 
% for the Modulation of Photoluminescence Properties. Nanomaterials (Basel). 
% 2023 May 23;13(11):1715. doi: 10.3390/nano13111715. PMID: 37299618; PMCID: PMC10254275.
chla = [390,0.08; 410,0.22; 430,0.54; 445,0.47; 460,0.98; 470,0.40; 480,0.12; 500,0.05; 520,0.08; 540,0.07; 570,0.09; 600,0.06; 620,0.15; 645,0.10; 665,0.73; 680,0.25; 700,0.01];
chlb = [390,0.15; 415,0.40; 435,0.51; 455,0.94; 465,0.96; 475,0.20; 490,0.03; 520,0.04; 550,0.03; 590,0.08; 615,0.60; 635,0.18; 655,0.06; 680,0.01];
pr   = [350,0.23; 375,0.31; 400,0.20; 425,0.07; 450,0.02; 500,0.01; 550,0.08; 600,0.32; 635,0.68; 666,1.00; 685,0.58; 700,0.18; 730,0.04; 760,0.02; 800,0.01];
pfr  = [350,0.09; 380,0.22; 405,0.26; 435,0.15; 470,0.04; 520,0.01; 570,0.03; 620,0.11; 660,0.31; 680,0.44; 710,0.46; 735,0.65; 760,0.35; 780,0.11; 800,0.02];
% Use Spline Interpolation for smooth, natural curve profiles
w_query = 330:0.5:800;
y_chla  = pchip(chla(:,1), chla(:,2), w_query); y_chla(w_query < 390 | w_query > 700) = 0;
y_chlb  = pchip(chlb(:,1), chlb(:,2), w_query); y_chlb(w_query < 390 | w_query > 680) = 0;
y_pr    = pchip(pr(:,1), pr(:,2), w_query);
y_pfr   = pchip(pfr(:,1), pfr(:,2), w_query);
n=size(wavelength,1);
X= y_pfr(1:n);
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(w_query, y_pfr, 'Color', [0.00 0.85 0.25], 'LineWidth', 2);
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Absorption spectra of photosensitive pigment PFR','Blue region', 'Green region', 'Red region'});
 
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','pigmentPRF', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','pigmentPRF', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength, X, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'StandardPlant')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2);
PL = PL / max(PL); 

% --- 1. Standard McCree Curve (Average Crop Sensitivity) ---
wavelength2 = 300:0.5:800;
McCree = 0.75*exp(-(wavelength-440).^2 / (2*25^2)) + ... % Blue
         0.2*exp(-(wavelength-550).^2 / (2*40^2)) + ... % Green
         1.0*exp(-(wavelength-660).^2 / (2*25^2));     % Red
McCree = McCree / max(McCree); % Normalize

McCree2 = 0.75*exp(-(wavelength2-440).^2 / (2*25^2)) + ... % Blue
         0.2*exp(-(wavelength2-550).^2 / (2*40^2)) + ... % Green
         1.0*exp(-(wavelength2-660).^2 / (2*25^2));     % Red
McCree2 = McCree2 / max(McCree2); % Normalize
X = McCree;
X2 = McCree2;

% --- Core Mathematical Integrations ---
raw_overlap_score = trapz(wavelength, PL .* X);
max_plant_area = trapz(wavelength, X .* X);
total_light_area = trapz(wavelength, PL);
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;

% Check Handles for Constants
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end

if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end

if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end

DLI = (PPFD * 3600 * photoperiod_hours) / 1000000;
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100)) / 100);
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;

%% --- Update GUI Elements ---
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Normalized Overlap Score: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% Plot the output
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'McCree');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Standard Plant Sensitivity Curve','Blue region', 'Green region', 'Red region'});
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Standard_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Standard_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'VINCA')==1
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
legend('Location', 'NorthEast');hold on;

% --- 2. Vinca-Specific Sensitivity ---
% Vinca has higher sensitivity in the UV/Blue for alkaloid production
wavelength2=300:0.5:800;
Vinca2 = 0.85*exp(-(wavelength2-430).^2 / (2*20^2)) + ... % Shifted Blue
        0.55*exp(-(wavelength2-545).^2 / (2*35^2)) + ... % Anthocyanin Green
        1.0*exp(-(wavelength2-665).^2 / (2*22^2));      % Red
Vinca2 = Vinca2 / max(Vinca2); % Normalize
Vinca = 0.85*exp(-(wavelength-430).^2 / (2*20^2)) + ... % Shifted Blue
        0.55*exp(-(wavelength-545).^2 / (2*35^2)) + ... % Anthocyanin Green
        1.0*exp(-(wavelength-665).^2 / (2*22^2));      % Red
Vinca = Vinca / max(Vinca); % Normalize

% Vinca has Loower sensitivity in the Blue becuause of for alkaloid production
X2= Vinca2;
X= Vinca;
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;

% Daily Biomass Yield Estimation Formula (Assuming a standard baseline DLI of 15.0)
%DLI = 15.0;  % Daily Light Integral: mol / (m^2 * day)
%alpha = 0.025; % Crop conversion structural mass coefficient factor: grams / mol
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 1.08; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100)))/100;

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity');
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Vinca');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Vinca Sensitivity curve(medical)','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Vinca_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Vinca_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Rosemary')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');
%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
legend('Location', 'NorthEast');hold on;

% --- Rosemary-Specific Sensitivity ---
% Rosemary has high sensitivity to Blue for Essential Oils and Deep Red for Biomass
wavelength2=300:0.5:800;
Rosemary = 0.95*exp(-(wavelength-450).^2 / (2*25^2)) + ... % Peak Blue for Terpenes/Camphor
           0.40*exp(-(wavelength-550).^2 / (2*40^2)) + ... % Lower Green sensitivity
           1.0*exp(-(wavelength-660).^2 / (2*20^2))  + ... % Peak Red for fast growth
           0.30*exp(-(wavelength-730).^2 / (2*15^2));      % Far-Red for shade avoidance
Rosemary = Rosemary / max(Rosemary); % Normaliz
Rosemary2 = 0.95*exp(-(wavelength2-450).^2 / (2*25^2)) + ... % Peak Blue for Terpenes/Camphor
           0.40*exp(-(wavelength2-550).^2 / (2*40^2)) + ... % Lower Green sensitivity
           1.0*exp(-(wavelength2-660).^2 / (2*20^2))  + ... % Peak Red for fast growth
           0.30*exp(-(wavelength2-730).^2 / (2*15^2));      % Far-Red for shade avoidance
Rosemary2 = Rosemary2 / max(Rosemary2); % Normaliz
       X= Rosemary;
       X2= Rosemary2;
  % --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity');
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Rosemary');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Rosemary Sensitivity curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Rosemary_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Rosemary_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Lavender')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)
PL = PL / max(PL); 
% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');
%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
legend('Location', 'NorthEast');hold on;

% Lavender sensitivity: Higher Blue/UV-A for Linalool production 
% and strong Red for flower spike development.
wavelength2=300:0.5:800;

Lavender = 0.35*exp(-(wavelength-380).^2 / (2*15^2)) + ... % UV-A for aromatic terpene defense
           1.0*exp(-(wavelength-450).^2 / (2*25^2))  + ... % Strong Blue for oil quality
           0.45*exp(-(wavelength-555).^2 / (2*35^2)) + ... % Mid-Green for canopy penetration
           0.90*exp(-(wavelength-660).^2 / (2*20^2)) + ... % Deep Red for biomass
           0.25*exp(-(wavelength-735).^2 / (2*10^2));      % Far-Red for flowering signals
Lavender = Lavender / max(Lavender); % Normalize
X= Lavender;
Lavender2 = 0.35*exp(-(wavelength2-380).^2 / (2*15^2)) + ... % UV-A for aromatic terpene defense
           1.0*exp(-(wavelength2-450).^2 / (2*25^2))  + ... % Strong Blue for oil quality
           0.45*exp(-(wavelength2-555).^2 / (2*35^2)) + ... % Mid-Green for canopy penetration
           0.90*exp(-(wavelength2-660).^2 / (2*20^2)) + ... % Deep Red for biomass
           0.25*exp(-(wavelength2-735).^2 / (2*10^2));      % Far-Red for flowering signals
Lavender2 = Lavender2 / max(Lavender2); % Normalize
X2= Lavender2;
  % --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;

p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Lavender');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Lavender Sensitivity curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Lavender_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Lavender_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Saffron')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;


% --- Saffron-Specific Sensitivity ---
wavelength2=300:0.5:800;
Saffron = 0.6*exp(-(wavelength-450).^2/(2*20^2)) + ... % Blue
          0.3*exp(-(wavelength-560).^2/(2*40^2)) + ... % Green
          1.0*exp(-(wavelength-660).^2/(2*25^2)) + ... % Red
          0.4*exp(-(wavelength-730).^2/(2*15^2));      % Far-Red (Critical for Crocus)
Saffron = Saffron / max(Saffron);
X = Saffron;
Saffron2 = 0.6*exp(-(wavelength2-450).^2/(2*20^2)) + ... % Blue
          0.3*exp(-(wavelength2-560).^2/(2*40^2)) + ... % Green
          1.0*exp(-(wavelength2-660).^2/(2*25^2)) + ... % Red
          0.4*exp(-(wavelength2-730).^2/(2*15^2));      % Far-Red (Critical for Crocus)
Saffron2 = Saffron2 / max(Saffron2);
X2 = Saffron2
  % --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Saffron');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Saffron Sensitivity Curve','Blue region', 'Green region', 'Red region'});  
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Saffron_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Saffron_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end

if strcmp(RareEarthMaterial,'AloeVera')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;
 % Aloe Vera Sensitivity Curve (McCree-style Model)
% Based on Chlorophyll a and b absorption peaks for succulents

% Define Aloe-specific Sensitivity Components
Blue_Aloe  = 0.85 * exp(-(wavelength - 435).^2 / (2 * 22^2)); % Shifted to 435nm
Green_Aloe = 0.12 * exp(-(wavelength - 550).^2 / (2 * 45^2)); % Low green sensitivity
Red_Aloe   = 1.00 * exp(-(wavelength - 665).^2 / (2 * 28^2)); % Shifted to 665nm for Chlorophyll a

% Sum the components
Aloe_Sensitivity = Blue_Aloe + Green_Aloe + Red_Aloe;
Aloe_Sensitivity = Aloe_Sensitivity / max(Aloe_Sensitivity);
X= Aloe_Sensitivity;

Blue_Aloe2  = 0.85 * exp(-(wavelength2 - 435).^2 / (2 * 22^2)); % Shifted to 435nm
Green_Aloe2 = 0.12 * exp(-(wavelength2 - 550).^2 / (2 * 45^2)); % Low green sensitivity
Red_Aloe2   = 1.00 * exp(-(wavelength2 - 665).^2 / (2 * 28^2)); % Shifted to 665nm for Chlorophyll a
Aloe_Sensitivity2 = Blue_Aloe2 + Green_Aloe2 + Red_Aloe2;
Aloe_Sensitivity2 = Aloe_Sensitivity2 / max(Aloe_Sensitivity2);
X2= Aloe_Sensitivity2;

% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'AloeVera');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'AloeVera Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Aloevera_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Aloevera_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Jasmine')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;
 % Aloe Vera Sensitivity Curve (McCree-style Model)
% Based on Chlorophyll a and b absorption peaks for succulents

% Define Aloe-specific Sensitivity Components
Blue_Jasmine  = 0.90 * exp(-(wavelength - 440).^2 / (2 * 24^2)); % Blue Peak: Strong absorption for vegetative leaf growth
Green_Jasmine = 0.16 * exp(-(wavelength - 545).^2 / (2 * 40^2)); % Green Valley: Moderate baseline use of green photons
Red_Jasmine   = 1.00 * exp(-(wavelength - 660).^2 / (2 * 26^2)); % Red Peak: Dominant peak at 660nm optimized for driving flowering/blooming

% Combine the spectral components
X_Jasmine = Blue_Jasmine + Green_Jasmine + Red_Jasmine;

% Normalize the final curve to a maximum of 1.0
X = X_Jasmine / max(X_Jasmine);
% Define Aloe-specific Sensitivity Components
Blue_Jasmine2  = 0.90 * exp(-(wavelength2 - 440).^2 / (2 * 24^2)); % Blue Peak: Strong absorption for vegetative leaf growth
Green_Jasmine2 = 0.16 * exp(-(wavelength2 - 545).^2 / (2 * 40^2)); % Green Valley: Moderate baseline use of green photons
Red_Jasmine2   = 1.00 * exp(-(wavelength2 - 660).^2 / (2 * 26^2)); % Red Peak: Dominant peak at 660nm optimized for driving flowering/blooming
X_Jasmine2 = Blue_Jasmine2 + Green_Jasmine2 + Red_Jasmine2;
X2 = X_Jasmine2 / max(X_Jasmine2);

% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Jasmine');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Jasmine Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Jasmine_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Jasmine_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Sweet Corn')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;
 % Aloe Vera Sensitivity Curve (McCree-style Model)
% Based on Chlorophyll a and b absorption peaks for succulents

% Define Sweet Corn-specific Sensitivity Components (C4 Photosynthetic Profile)
% Blue Peak (450nm): Essential for stomatal opening, structural density, and stalk strength
Blue_Corn  = 0.78 * exp(-(wavelength - 450).^2 / (2 * 22^2)); 

% Green Valley (550nm): Higher baseline than succulents; vital for deep inner-canopy leaf penetration
Green_Corn = 0.45 * exp(-(wavelength - 550).^2 / (2 * 45^2)); 

% Red Peak (660nm): The absolute dominant driving force for peak carbon assimilation and biomass in maize
Red_Corn   = 1.00 * exp(-(wavelength - 660).^2 / (2 * 25^2)); 

% Combine the spectral components
X_Corn = Blue_Corn + Green_Corn + Red_Corn;

% Normalize the final curve to a maximum of 1.0
X = X_Corn / max(X_Corn);


% Define Sweet Corn-specific Sensitivity Components for the second array
Blue_Corn2  = 0.78 * exp(-(wavelength2 - 450).^2 / (2 * 22^2)); 
Green_Corn2 = 0.45 * exp(-(wavelength2 - 550).^2 / (2 * 45^2)); 
Red_Corn2   = 1.00 * exp(-(wavelength2 - 660).^2 / (2 * 25^2)); 

X_Corn2 = Blue_Corn2 + Green_Corn2 + Red_Corn2;
X2 = X_Corn2 / max(X_Corn2);
% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Sweet Corn');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Sweet Corn Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','SweetCorn_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','SweetCorn_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Strawberry')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;

 %Define Strawberry-specific Sensitivity Components (High Flowering/Fruiting Profile)
% Blue Peak (450nm): Promotes compact growth, prevents runner stretching, and boots fruit anthocyanins
Blue_Strawberry  = 0.82 * exp(-(wavelength - 450).^2 / (2 * 22^2)); 

% Green Valley (540nm): Lower than corn but higher than succulents to penetrate dense, low-lying foliage
Green_Strawberry = 0.28 * exp(-(wavelength - 540).^2 / (2 * 38^2)); 

% Red Peak (660nm): The primary engine driving photosynthesis, flower induction, and sugar accumulation
Red_Strawberry   = 1.00 * exp(-(wavelength - 660).^2 / (2 * 25^2)); 

% Combine the spectral components
X_Strawberry = Blue_Strawberry + Green_Strawberry + Red_Strawberry;

% Normalize the final curve to a maximum of 1.0
X = X_Strawberry / max(X_Strawberry);


% Define Strawberry-specific Sensitivity Components for the second array
Blue_Strawberry2  = 0.82 * exp(-(wavelength2 - 450).^2 / (2 * 22^2)); 
Green_Strawberry2 = 0.28 * exp(-(wavelength2 - 540).^2 / (2 * 38^2)); 
Red_Strawberry2   = 1.00 * exp(-(wavelength2 - 660).^2 / (2 * 25^2)); 

X_Strawberry2 = Blue_Strawberry2 + Green_Strawberry2 + Red_Strawberry2;
X2 = X_Strawberry2 / max(X_Strawberry2);

% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Strawberry');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Strawberry Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Strawberry_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Strawberry_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Pineapple')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;

% Define Pineapple-specific Sensitivity Components (Tropical CAM Profile)
% Blue Peak (445nm): Regulates thick cuticle penetration and twilight stomatal opening triggers
Blue_Pineapple  = 0.88 * exp(-(wavelength - 445).^2 / (2 * 23^2)); 

% Green Valley (545nm): Deep valley typical of heavy-cuticle CAM leaves with high surface reflectance
Green_Pineapple = 0.18 * exp(-(wavelength - 545).^2 / (2 * 42^2)); 

% Red Peak (660nm): Main energy source driving daytime carbon fixation and heavy fruit sugar storage
Red_Pineapple   = 1.00 * exp(-(wavelength - 660).^2 / (2 * 26^2)); 

% Combine the spectral components
X_Pineapple = Blue_Pineapple + Green_Pineapple + Red_Pineapple;

% Normalize the final curve to a maximum of 1.0
X = X_Pineapple / max(X_Pineapple);


% Define Pineapple-specific Sensitivity Components for the second array
Blue_Pineapple2  = 0.88 * exp(-(wavelength2 - 445).^2 / (2 * 23^2)); 
Green_Pineapple2 = 0.18 * exp(-(wavelength2 - 545).^2 / (2 * 42^2)); 
Red_Pineapple2   = 1.00 * exp(-(wavelength2 - 660).^2 / (2 * 26^2)); 

X_Pineapple2 = Blue_Pineapple2 + Green_Pineapple2 + Red_Pineapple2;
X2 = X_Pineapple2 / max(X_Pineapple2);

% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Pineapple');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Pineapple Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Pineapple_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Pineapple_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Cucumber')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;

% Define Cucumber-specific Sensitivity Components (Dense Broad-Leaf C3 Profile)
% Blue Peak (450nm): Suppresses vine stretching, thickens leaf tissue, and optimizes transpiration
Blue_Cucumber  = 0.85 * exp(-(wavelength - 450).^2 / (2 * 22^2)); 

% Green Valley (550nm): Highly elevated baseline to simulate critical deep-canopy photon penetration
Green_Cucumber = 0.42 * exp(-(wavelength - 550).^2 / (2 * 45^2)); 

% Red Peak (660nm): The main photosynthetic engine driving rapid vegetative growth and heavy fruit mass
Red_Cucumber   = 1.00 * exp(-(wavelength - 660).^2 / (2 * 25^2)); 

% Combine the spectral components
X_Cucumber = Blue_Cucumber + Green_Cucumber + Red_Cucumber;

% Normalize the final curve to a maximum of 1.0
X = X_Cucumber / max(X_Cucumber);


% Define Cucumber-specific Sensitivity Components for the second array
Blue_Cucumber2  = 0.85 * exp(-(wavelength2 - 450).^2 / (2 * 22^2)); 
Green_Cucumber2 = 0.42 * exp(-(wavelength2 - 550).^2 / (2 * 45^2)); 
Red_Cucumber2   = 1.00 * exp(-(wavelength2 - 660).^2 / (2 * 25^2)); 

X_Cucumber2 = Blue_Cucumber2 + Green_Cucumber2 + Red_Cucumber2;
X2 = X_Cucumber2 / max(X_Cucumber2);

% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Cucumber');
%legend([p1, p2],{'Glass Emission','Vica Sensitivity curve(medical)'});
%legend('Location', 'NorthEast');hold on;
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Cucumber Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Cucumber_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Cucumber_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
if strcmp(RareEarthMaterial,'Tomato')==1;
load('PLdata.mat','M');
wavelength = M(:,1);
PL = M(:,2)

PL = PL / max(PL); 

% --- 4. Plotting ---
%figure('Color', 'w');
plot(wavelength, PL, 'k', 'LineWidth', 2.5, 'DisplayName', 'Combined Spectrum'); 
fill(wavelength, PL, 'g', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Tb3+ Contribution');
%fill(wavelength, I_Sm, 'r', 'FaceAlpha', 0.2, 'EdgeColor', 'none', 'DisplayName', 'Sm3+ Contribution');

%title('Emission Spectrum of Sm^{3+}/Tb^{3+} Co-doped Glass');
xlabel('Wavelength (nm)'); ylabel('Relative Intensity (a.u.)');
%legend('Location', 'NorthEast');hold on;
wavelength2=300:0.5:800;
 % Aloe Vera Sensitivity Curve (McCree-style Model)
% Based on Chlorophyll a and b absorption peaks for succulents

% Define Tomato-specific Sensitivity Components (Dense Fruiting C3 Canopy)
% Blue Peak (450nm): Suppresses stem stretching, thickens leaf tissue, and enhances fruit lycopene
Blue_Tomato  = 0.84 * exp(-(wavelength - 450).^2 / (2 * 22^2)); 

% Green Valley (550nm): Highly elevated baseline allowing light penetration into dense under-canopy layers
Green_Tomato = 0.38 * exp(-(wavelength - 550).^2 / (2 * 44^2)); 

% Red Peak (660nm): Absolute dominant driver for peak carbon fixation, flowering, and heavy fruit mass
Red_Tomato   = 1.00 * exp(-(wavelength - 660).^2 / (2 * 25^2)); 

% Combine the spectral components
X_Tomato = Blue_Tomato + Green_Tomato + Red_Tomato;

% Normalize the final curve to a maximum of 1.0
X = X_Tomato / max(X_Tomato);


% Define Tomato-specific Sensitivity Components for the second array
Blue_Tomato2  = 0.84 * exp(-(wavelength2 - 450).^2 / (2 * 22^2)); 
Green_Tomato2 = 0.38 * exp(-(wavelength2 - 550).^2 / (2 * 44^2)); 
Red_Tomato2   = 1.00 * exp(-(wavelength2 - 660).^2 / (2 * 25^2)); 

X_Tomato2 = Blue_Tomato2 + Green_Tomato2 + Red_Tomato2;
X2 = X_Tomato2 / max(X_Tomato2);

% --- Core Mathematical Integrations ---
% 1. Calculate Raw Photosynthetic Overlap Score (Shared Integrand Area)
raw_overlap_score = trapz(wavelength, PL .* X);

% 2. Calculate Maximum Theoretical Reference Area of the Target Plant Curve
% (This represents a hypothetical light source that perfectly mimics the plant curve)
max_plant_area = trapz(wavelength, X .* X);

% 3. Calculate Total Transmitted Emitted Optical Area Profile
total_light_area = trapz(wavelength, PL);

% Net Plant Growth Efficiency (?growth) percentage metric
net_growth_efficiency = (raw_overlap_score / total_light_area) * 100;
if isfield(handles, 'edit5')
    photoperiod_hours = str2double(get(handles.edit5, 'String'));
else
    photoperiod_hours = 16.0; 
end
if isfield(handles, 'edit3')
    PPFD = str2double(get(handles.edit3, 'String'));
else
    PPFD = 500.0; 
end
if isfield(handles, 'edit7')
    alpha = str2double(get(handles.edit7, 'String'));
else
    alpha = 108; 
end
DLI = (PPFD * 3600 * photoperiod_hours) / 1000000
daily_biomass_yield = (alpha * (DLI * (net_growth_efficiency / 100))/100);

% --- Derive Normalized Performance Metrics ---
% Standardized Overlap Score scaled safely between 0.0 and 1.0 (or 0% to 100%)
normalized_overlap_score = (raw_overlap_score / max_plant_area) * 100;
p1 = plot(wavelength, PL, 'r', 'DisplayName', 'Total_Intensity'); hold on;
p2 = plot(wavelength2, X2, 'b--', 'DisplayName', 'Tomato');
p3 = patch([400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Blue 
p4 = patch([500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Green 
p5 = patch([600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.3); % Red 
%title(['Photosynthetic Overlap Score: ', num2str(ypf_score)]);
xlabel('Wavelength (nm)');
legend([p1, p2, p3, p4, p5],{GEmission,'Tomato Sensetivity Curve','Blue region', 'Green region', 'Red region'});
if isfield(handles, 'edit1')
    set(handles.edit1, 'String', [num2str(normalized_overlap_score, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(normalized_overlap_score, '%.2f'), ' %']);
end

% 5. Output to a Second GUI Edit Text Box (e.g., edit2 for Plant Efficiency)
% Ensure you have created a text box with Tag: edit2 in your GUIDE/App Designer layout
if isfield(handles, 'edit2')
    set(handles.edit2, 'String', [num2str(net_growth_efficiency, '%.2f'), ' %']);
else
    disp(['Net Plant Growth Efficiency: ', num2str(net_growth_efficiency, '%.2f'), ' %']);
end

% 4. Output to a New GUI Text Box (e.g., Tag: edit_yield)
if isfield(handles, 'edit4')
    set(handles.edit4, 'String', [num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
else
    disp(['Predicted Daily Biomass Yield: ', num2str(daily_biomass_yield, '%.2f'), ' g/m²/day']);
end
%% =========================================================================
%% --- AUTOMATED SILENT PDF REPORT EXPORT BLOCK ---
%% =========================================================================

% 1. Create a specific output directory silently if it does not exist
targetFolder = fullfile(pwd, 'Reports');
if ~exist(targetFolder, 'dir')
    mkdir(targetFolder);
end

% 2. Automatically format a timestamped unique filename
timestampStr = datestr(now, 'yyyymmdd_HHMMSS');
pdfFilename = fullfile(targetFolder, ['Analysis_Report_','Tomato_Plant', timestampStr, '.pdf']);
pngFilename = fullfile(targetFolder, ['Analysis_Report_','Tomato_Plant', timestampStr, '.png']); % New PNG target
% Fix: Added the correct [X, Y, Width, Height] vector value for the Position parameter
reportFig = figure('Visible', 'off', 'Units', 'pixels', 'Position', [100, 100, 800, 1000], 'Color', 'w');

    % --- Document Title Annotation ---
    annotation(reportFig, 'textbox', [0.05, 0.91, 0.9, 0.05], ...
        'String', 'Photosynthetic Overlap & Yield Summary Report', ...
        'FontSize', 16, 'FontWeight', 'bold', 'EdgeColor', 'none', 'HorizontalAlignment', 'center');
    
   % Fix: Changed 'FontColor' to 'Color' for the timestamp annotation
annotation(reportFig, 'textbox', [0.05, 0.88, 0.9, 0.03], ...
    'String', ['Generated automatically on: ', datestr(now, 'yyyy-mm-dd HH:MM:SS')], ...
    'FontSize', 9, 'Color', [0.4 0.4 0.4], 'EdgeColor', 'none', 'HorizontalAlignment', 'center');

    % --- Plot Layout Construction ---
    pdfAxes = axes(reportFig, 'Position', [0.12, 0.44, 0.78, 0.38]);
    
    p1_pdf = plot(pdfAxes, wavelength, PL, 'r', 'LineWidth', 1.8, 'DisplayName', 'Total_Intensity'); 
    hold(pdfAxes, 'on');
    p2_pdf = plot(pdfAxes, wavelength2, X2, 'b--', 'LineWidth', 1.5, 'DisplayName', 'McCree');
    
    % Re-draw visual background spectrum patches
    p3_pdf = patch(pdfAxes, [400 500 500 400], [0 0 1.2 1.2], [0.8 0.9 1], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p4_pdf = patch(pdfAxes, [500 600 600 500], [0 0 1.2 1.2], [0.8 1 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
    p5_pdf = patch(pdfAxes, [600 700 700 600], [0 0 1.2 1.2], [1 0.8 0.8], 'EdgeColor', 'none', 'FaceAlpha', 0.25); 
 
    % Formatting properties
    xlabel(pdfAxes, 'Wavelength (nm)', 'FontWeight', 'bold');
    ylabel(pdfAxes, 'Normalized Scale / Sensitivity', 'FontWeight', 'bold');
    ylim(pdfAxes, [0, 1.2]);
    grid(pdfAxes, 'on');
    
    if ~exist('GEmission', 'var'), GEmission = 'Emitted Spectrum'; end
    legend(pdfAxes, [p1_pdf, p2_pdf, p3_pdf, p4_pdf, p5_pdf], ...
        {GEmission, 'Standard Plant Sensitivity Curve', 'Blue region (400-500 nm)', 'Green region (500-600 nm)', 'Red region (600-700 nm)'}, ...
        'Location', 'northeast', 'FontSize', 8);

    % --- Structured Parameter Summary Table ---
    reportSummary = sprintf([ ...
        '=====================================================================\n', ...
        '                    SYSTEM PERFORMANCE METRICS                       \n', ...
        '=====================================================================\n\n', ...
        '  * Daily Light Integral (DLI)      :  %.2f mol/m²/day\n', ...
        '  * Net Plant Growth Efficiency     :  %.2f %%\n', ...
        '  * Photosynthetic Overlap Score    :  %.2f %%\n', ...
        '  * Predicted Daily Biomass Yield   :  %.2f g/m²/day\n\n', ...
        '---------------------------------------------------------------------\n', ...
        '  [Input Configuration Context]\n', ...
        '  Target PPFD: %.1f umol/m²/s  |  Photoperiod: %.1f Hours  |  Alpha: %.1f\n', ...
        '====================================================================='], ...
        DLI, net_growth_efficiency, normalized_overlap_score, daily_biomass_yield, PPFD, photoperiod_hours, alpha);

   % Fix: Removed 'LineSpacing' property to match standard TextBox properties
annotation(reportFig, 'textbox', [0.12, 0.08, 0.78, 0.28], ...
    'String', reportSummary, ...
    'FontName', 'Courier', ...
    'FontSize', 10, ...
    'EdgeColor', [0.75 0.75 0.75], ...
    'BackgroundColor', [0.97 0.97 0.97], ...
    'Margin', 12);
    % --- Save Action ---
    print(reportFig, pdfFilename, '-dpdf', '-bestfit', '-r300')
    print(reportFig, pngFilename, '-dpng', '-r300');
    % Use a non-blocking console display to confirm creation
    fprintf('Report generated successfully: %s\n', pdfFilename)
    

% Clear the background canvas asset handle cleanly
if ishandle(reportFig), close(reportFig); end
end
% --- Executes on selection change in popupmenu1.
function popupmenu2_Callback(hObject, eventdata, handles)
% hObject    handle to popupmenu1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% Hints: contents = cellstr(get(hObject,'String')) returns popupmenu1 contents as cell array
%        contents{get(hObject,'Value')} returns selected item from popupmenu1


% --- Executes during object creation, after setting all properties.
function popupmenu2_CreateFcn(hObject, eventdata, handles)
% hObject    handle to popupmenu1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    empty - handles not created until after all CreateFcns called

% Hint: popupmenu controls usually have a white background on Windows.
%       See ISPC and COMPUTER.
if ispc && isequal(get(hObject,'BackgroundColor'), get(0,'defaultUicontrolBackgroundColor'))
    set(hObject,'BackgroundColor','white');
end

% --- Executes during object creation, after setting all properties.
function pushbutton5_Callback(hObject, eventdata, handles)
% hObject    handle to pushbutton1 (see GCBO)
% eventdata  reserved - to be defined in a future version of MATLAB
% handles    structure with handles and user data (see GUIDATA)

% readint the PL data 
% 1. Open a file selection dialog filtered for .txt files
warning off ; 
close all;
MainProgramPlant

